import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const adjustBalanceSchema = z.object({
  balanceId: z.string().min(1),
  totalAllocated: z.number().min(0).max(365),
  carriedOver: z.number().min(0).max(365),
  reason: z.string().min(5, "Adjustment reason must be at least 5 characters"),
});

// GET /api/balances - Get balances
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId") || session.userId;
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

  // If requesting someone else's balance, check permissions
  if (targetUserId !== session.userId) {
    if (!["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(session.role)) {
      return forbiddenResponse("You are not authorized to view other employees' balances.");
    }
  }

  const balances = await prisma.leaveBalance.findMany({
    where: {
      userId: targetUserId,
      fiscalYear: year,
    },
    include: {
      leaveType: true,
      user: {
        select: { firstName: true, lastName: true, employeeCode: true, department: true },
      },
    },
    orderBy: { leaveType: { name: "asc" } },
  });

  return NextResponse.json({ balances, year });
}

// PATCH /api/balances - Adjust quotas (HR & Super Admin only)
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only HR and Super Admin can adjust leave quotas.");
  }

  try {
    const body = await req.json();
    const parseResult = adjustBalanceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { balanceId, totalAllocated, carriedOver, reason } = parseResult.data;

    const existing = await prisma.leaveBalance.findUnique({
      where: { id: balanceId },
      include: { user: true, leaveType: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Balance record not found." }, { status: 404 });
    }

    const updated = await prisma.leaveBalance.update({
      where: { id: balanceId },
      data: {
        totalAllocated,
        carriedOver,
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "LEAVE_BALANCE_MANUAL_ADJUSTMENT",
      resourceType: "LEAVE_BALANCE",
      resourceId: balanceId,
      details: {
        employee: `${existing.user.firstName} ${existing.user.lastName}`,
        leaveType: existing.leaveType.name,
        previousAllocated: existing.totalAllocated,
        newAllocated: totalAllocated,
        previousCarriedOver: existing.carriedOver,
        newCarriedOver: carriedOver,
        reason,
      },
      req,
    });

    return NextResponse.json({ success: true, balance: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to adjust balance." },
      { status: 500 }
    );
  }
}
