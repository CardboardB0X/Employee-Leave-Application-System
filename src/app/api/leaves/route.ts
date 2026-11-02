import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";
import {
  calculateWorkingDaysAsync,
  generateRequestNumber,
  hasConflictingLeave,
} from "@/lib/leave-calculator";

const createLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(["FIRST_HALF", "SECOND_HALF"]).optional(),
  reason: z.string().min(5, "Please provide a detailed reason (at least 5 characters)"),
  attachmentPath: z.string().optional().nullable(),
  attachmentOriginalName: z.string().optional().nullable(),
});

// GET /api/leaves - List leave requests with strict RBAC boundary
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const filterUserId = searchParams.get("userId");

  let whereClause: any = {};

  // 1. Role-based scoping
  if (session.role === "EMPLOYEE") {
    // Employees can strictly ONLY view their own leave requests
    whereClause.userId = session.userId;
  } else if (session.role === "MANAGER") {
    if (filterUserId && filterUserId === session.userId) {
      whereClause.userId = session.userId;
    } else {
      // Manager can view own leaves + direct subordinates or employees within their department
      whereClause.OR = [
        { userId: session.userId },
        { user: { managerId: session.userId } },
        ...(session.departmentId ? [{ user: { departmentId: session.departmentId } }] : []),
      ];
    }
  } else {
    // HR_ADMIN and SUPER_ADMIN can view all requests or filter by user
    if (filterUserId) {
      whereClause.userId = filterUserId;
    }
  }

  // 2. Status filter if supplied
  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          email: true,
          department: { select: { name: true, code: true } },
        },
      },
      leaveType: true,
      approvals: {
        include: {
          approver: {
            select: { firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { actionTimestamp: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

// POST /api/leaves - Submit leave application with transactional balance safety
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parseResult = createLeaveSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      leaveTypeId,
      startDate: startStr,
      endDate: endStr,
      isHalfDay,
      halfDayType,
      reason,
      attachmentPath,
      attachmentOriginalName,
    } = parseResult.data;

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date." },
        { status: 400 }
      );
    }

    // 1. Calculate working days (automatically excluding weekends & company holidays)
    const { totalDays, holidaysCount } = await calculateWorkingDaysAsync(
      startDate,
      endDate,
      isHalfDay
    );

    if (totalDays <= 0) {
      return NextResponse.json(
        { error: "Selected date range contains 0 working days (falls on weekends or official company holidays)." },
        { status: 400 }
      );
    }

    // 2. Check for date collision with existing active requests
    const hasConflict = await hasConflictingLeave(session.userId, startDate, endDate);
    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "You already have an active (pending or approved) leave request covering these dates.",
        },
        { status: 400 }
      );
    }

    // 3. Verify Leave Type
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });

    if (!leaveType || !leaveType.isActive) {
      return NextResponse.json(
        { error: "Selected leave type is invalid or inactive." },
        { status: 400 }
      );
    }

    // Attachment check if mandatory
    if (leaveType.requiresAttachment && !attachmentPath && totalDays >= 2) {
      return NextResponse.json(
        {
          error: `${leaveType.name} requires supporting documentation (e.g. medical certificate).`,
        },
        { status: 400 }
      );
    }

    const currentYear = startDate.getFullYear();

    // 4. ACID Transaction: Verify available quota and atomically hold pending days
    const newLeave = await prisma.$transaction(async (tx) => {
      // Find balance record
      let balance = await tx.leaveBalance.findUnique({
        where: {
          uk_user_leave_year: {
            userId: session.userId,
            leaveTypeId: leaveType.id,
            fiscalYear: currentYear,
          },
        },
      });

      // If no balance record exists yet for this year, create one with default days
      if (!balance) {
        balance = await tx.leaveBalance.create({
          data: {
            userId: session.userId,
            leaveTypeId: leaveType.id,
            fiscalYear: currentYear,
            totalAllocated: leaveType.defaultAnnualDays,
            usedDays: 0,
            pendingDays: 0,
            carriedOver: 0,
          },
        });
      }

      const totalAllocated = Number(balance.totalAllocated);
      const carriedOver = Number(balance.carriedOver);
      const usedDays = Number(balance.usedDays);
      const pendingDays = Number(balance.pendingDays);

      const availableDays = totalAllocated + carriedOver - usedDays - pendingDays;

      // Unpaid leave can exceed quota, but standard paid leaves cannot
      if (leaveType.isPaid && availableDays < totalDays) {
        throw new Error(
          `Insufficient leave balance. Requested: ${totalDays} day(s), Available: ${availableDays} day(s).`
        );
      }

      // Increment pending balance
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { increment: totalDays },
        },
      });

      // Generate request identifier
      const count = await tx.leaveRequest.count();
      const requestNumber = `LR-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      // Create leave request
      const created = await tx.leaveRequest.create({
        data: {
          requestNumber,
          userId: session.userId,
          leaveTypeId: leaveType.id,
          startDate,
          endDate,
          totalDays,
          isHalfDay,
          halfDayType: isHalfDay ? halfDayType : null,
          reason,
          status: "PENDING",
          attachmentPath: attachmentPath || null,
          attachmentOriginalName: attachmentOriginalName || null,
        },
        include: {
          leaveType: true,
          user: {
            select: { firstName: true, lastName: true, employeeCode: true },
          },
        },
      });

      // Create notification for direct manager or HR
      const requester = await tx.user.findUnique({
        where: { id: session.userId },
        select: { managerId: true },
      });

      if (requester?.managerId) {
        await tx.notification.create({
          data: {
            userId: requester.managerId,
            title: "New Leave Application",
            message: `${session.firstName} ${session.lastName} applied for ${totalDays} day(s) of ${leaveType.name} (${requestNumber}).`,
            type: "APPROVAL",
            link: "/dashboard/approvals",
          },
        });
      }

      return created;
    });

    // Record audit event
    await logAuditEvent({
      actorId: session.userId,
      action: "LEAVE_REQUEST_SUBMITTED",
      resourceType: "LEAVE_REQUEST",
      resourceId: newLeave.id,
      details: {
        requestNumber: newLeave.requestNumber,
        leaveType: leaveType.name,
        totalDays,
        startDate: startStr,
        endDate: endStr,
      },
      req,
    });

    return NextResponse.json({ success: true, leave: newLeave }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating leave:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit leave request." },
      { status: 400 }
    );
  }
}
