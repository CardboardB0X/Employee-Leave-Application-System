import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(session.role)) {
    return forbiddenResponse("Only administrators and managers can generate leave reports.");
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const departmentId = searchParams.get("departmentId");
  const leaveTypeId = searchParams.get("leaveTypeId");
  const status = searchParams.get("status");

  let whereClause: any = {};

  // Manager scoping
  if (session.role === "MANAGER") {
    whereClause.OR = [
      { userId: session.userId },
      { user: { managerId: session.userId } },
      ...(session.departmentId ? [{ user: { departmentId: session.departmentId } }] : []),
    ];
  }

  // Department filter
  if (departmentId && departmentId !== "ALL") {
    whereClause.user = {
      ...whereClause.user,
      departmentId,
    };
  }

  // Leave type filter
  if (leaveTypeId && leaveTypeId !== "ALL") {
    whereClause.leaveTypeId = leaveTypeId;
  }

  // Status filter
  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  // Date range filter
  if (startDate || endDate) {
    whereClause.AND = [];
    if (startDate) {
      whereClause.AND.push({ startDate: { gte: new Date(startDate) } });
    }
    if (endDate) {
      whereClause.AND.push({ endDate: { lte: new Date(endDate) } });
    }
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { id: true, name: true, code: true } },
        },
      },
      leaveType: {
        select: { id: true, name: true, code: true, isPaid: true },
      },
      approvals: {
        include: {
          approver: { select: { firstName: true, lastName: true } },
        },
        orderBy: { actionTimestamp: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate aggregates
  let totalApprovedDays = 0;
  let totalPending = 0;
  let totalApproved = 0;
  let totalRejected = 0;

  leaves.forEach((l) => {
    if (l.status === "APPROVED") {
      totalApproved++;
      totalApprovedDays += Number(l.totalDays);
    } else if (l.status === "PENDING" || l.status === "MANAGER_APPROVED") {
      totalPending++;
    } else if (l.status === "REJECTED") {
      totalRejected++;
    }
  });

  await logAuditEvent({
    actorId: session.userId,
    action: "REPORT_GENERATED",
    resourceType: "REPORT",
    details: {
      totalRecords: leaves.length,
      filters: { startDate, endDate, departmentId, leaveTypeId, status },
    },
    req,
  });

  return NextResponse.json({
    leaves,
    aggregates: {
      totalRecords: leaves.length,
      totalApprovedDays,
      totalApproved,
      totalPending,
      totalRejected,
    },
  });
}
