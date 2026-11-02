import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const createLeaveTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2).max(10, "Code must be 2-10 characters").toUpperCase(),
  description: z.string().optional().nullable(),
  defaultAnnualDays: z.number().min(0).max(365),
  requiresAttachment: z.boolean().default(false),
  requiresHrApproval: z.boolean().default(false),
  isPaid: z.boolean().default(true),
});

const updateLeaveTypeSchema = z.object({
  id: z.string().uuid("Invalid leave type ID"),
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  defaultAnnualDays: z.number().min(0).max(365).optional(),
  requiresAttachment: z.boolean().optional(),
  requiresHrApproval: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const includeAll = searchParams.get("all") === "true";

  // Admins can view all (including inactive)
  const isAdmin = ["SUPER_ADMIN", "HR_ADMIN"].includes(session.role);
  const whereCondition = isAdmin && includeAll ? {} : { isActive: true };

  const leaveTypes = await prisma.leaveType.findMany({
    where: whereCondition,
    include: {
      _count: {
        select: { requests: true, balances: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ leaveTypes });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only Super Admin and HR Admin can manage leave types.");
  }

  try {
    const body = await req.json();
    const parseResult = createLeaveTypeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid leave type data." },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check duplicate name or code
    const existing = await prisma.leaveType.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A leave type with this name or code already exists." },
        { status: 400 }
      );
    }

    // Create leave type and seed current year balances for active users
    const newLeaveType = await prisma.$transaction(async (tx) => {
      const created = await tx.leaveType.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description || null,
          defaultAnnualDays: data.defaultAnnualDays,
          requiresAttachment: data.requiresAttachment,
          requiresHrApproval: data.requiresHrApproval,
          isPaid: data.isPaid,
          isActive: true,
        },
      });

      // Allocate to all active employees for current year
      const currentYear = new Date().getFullYear();
      const activeUsers = await tx.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      for (const u of activeUsers) {
        await tx.leaveBalance.create({
          data: {
            userId: u.id,
            leaveTypeId: created.id,
            fiscalYear: currentYear,
            totalAllocated: data.defaultAnnualDays,
            usedDays: 0,
            pendingDays: 0,
            carriedOver: 0,
          },
        });
      }

      return created;
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "LEAVE_TYPE_CREATED",
      resourceType: "LEAVE_TYPE",
      resourceId: newLeaveType.id,
      details: { name: newLeaveType.name, code: newLeaveType.code, defaultDays: data.defaultAnnualDays },
      req,
    });

    return NextResponse.json(
      { success: true, message: "Leave type created successfully.", leaveType: newLeaveType },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create leave type." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only Super Admin and HR Admin can modify leave types.");
  }

  try {
    const body = await req.json();
    const parseResult = updateLeaveTypeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const { id, ...updateFields } = parseResult.data;

    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Leave type not found." }, { status: 404 });
    }

    const updated = await prisma.leaveType.update({
      where: { id },
      data: updateFields,
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "LEAVE_TYPE_UPDATED",
      resourceType: "LEAVE_TYPE",
      resourceId: updated.id,
      details: updateFields,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Leave type updated successfully.",
      leaveType: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update leave type." },
      { status: 500 }
    );
  }
}
