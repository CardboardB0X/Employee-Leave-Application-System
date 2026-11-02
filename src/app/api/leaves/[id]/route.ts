import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { canAccessLeaveRequest, forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

// GET /api/leaves/[id] - Fetch leave request with IDOR prevention
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const access = await canAccessLeaveRequest(session, params.id);
  if (!access.allowed) {
    return forbiddenResponse(access.reason);
  }

  return NextResponse.json({ leave: access.leave });
}

// DELETE /api/leaves/[id] - Cancel pending leave request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const access = await canAccessLeaveRequest(session, params.id);
  if (!access.allowed) {
    return forbiddenResponse(access.reason);
  }

  const leave = access.leave;

  // Only PENDING or MANAGER_APPROVED requests can be cancelled by employee
  if (!["PENDING", "MANAGER_APPROVED"].includes(leave.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a leave request with status: ${leave.status}` },
      { status: 400 }
    );
  }

  // Only owner or Admin can cancel
  if (leave.userId !== session.userId && session.role !== "SUPER_ADMIN") {
    return forbiddenResponse("Only the requesting employee or Super Admin can cancel this leave.");
  }

  // Transaction: Release pending balance and mark as CANCELLED
  const fiscalYear = new Date(leave.startDate).getFullYear();

  await prisma.$transaction(async (tx) => {
    // Release pending balance
    await tx.leaveBalance.updateMany({
      where: {
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId,
        fiscalYear,
      },
      data: {
        pendingDays: { decrement: Number(leave.totalDays) },
      },
    });

    // Update status
    await tx.leaveRequest.update({
      where: { id: leave.id },
      data: { status: "CANCELLED" },
    });
  });

  await logAuditEvent({
    actorId: session.userId,
    action: "LEAVE_REQUEST_CANCELLED",
    resourceType: "LEAVE_REQUEST",
    resourceId: leave.id,
    details: { requestNumber: leave.requestNumber, totalDays: leave.totalDays },
    req,
  });

  return NextResponse.json({ success: true, message: "Leave request has been cancelled." });
}
