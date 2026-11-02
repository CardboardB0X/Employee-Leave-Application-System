import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { canAccessLeaveRequest, forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const cancelSchema = z.object({
  reason: z.string().min(3, "Cancellation reason must be at least 3 characters").optional(),
});

export async function POST(
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

  if (leave.userId !== session.userId && session.role !== "SUPER_ADMIN") {
    return forbiddenResponse("Only the requesting employee or Super Admin can cancel this leave.");
  }

  const fiscalYear = new Date(leave.startDate).getFullYear();
  const totalDays = Number(leave.totalDays);

  // Case 1: Pending or Manager Approved -> Immediate withdrawal
  if (leave.status === "PENDING" || leave.status === "MANAGER_APPROVED") {
    await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.updateMany({
        where: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          fiscalYear,
        },
        data: {
          pendingDays: { decrement: totalDays },
        },
      });

      await tx.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: "CANCELLED",
          cancellationReason: "Withdrawn by employee before final approval",
        },
      });
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "LEAVE_WITHDRAWN",
      resourceType: "LEAVE_REQUEST",
      resourceId: leave.id,
      details: { requestNumber: leave.requestNumber, totalDays },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Leave application has been withdrawn.",
      status: "CANCELLED",
    });
  }

  // Case 2: Already Approved -> Request cancellation with credit refund workflow
  if (leave.status === "APPROVED") {
    const body = await req.json().catch(() => ({}));
    const parseResult = cancelSchema.safeParse(body);
    const cancellationReason = parseResult.success && parseResult.data.reason
      ? parseResult.data.reason
      : "Cancellation requested by employee";

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: "CANCELLATION_REQUESTED",
          cancellationReason,
        },
      });

      // Notify manager and HR
      const notifTargetIds = new Set<string>();
      if (leave.user?.managerId) notifTargetIds.add(leave.user.managerId);

      const hrAdmins = await tx.user.findMany({
        where: { role: { name: "HR_ADMIN" }, status: "ACTIVE" },
        select: { id: true },
      });
      hrAdmins.forEach((hr) => notifTargetIds.add(hr.id));

      const targetList = Array.from(notifTargetIds);
      for (const targetId of targetList) {
        await tx.notification.create({
          data: {
            userId: targetId,
            title: "Leave Cancellation Requested",
            message: `${session.firstName} ${session.lastName} requested cancellation of approved leave (${leave.requestNumber}). Reason: "${cancellationReason}"`,
            type: "WARNING",
            link: "/dashboard/approvals",
          },
        });
      }
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "LEAVE_CANCELLATION_REQUESTED",
      resourceType: "LEAVE_REQUEST",
      resourceId: leave.id,
      details: { requestNumber: leave.requestNumber, reason: cancellationReason },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted. Your supervisor / HR will review and reverse leave credits.",
      status: "CANCELLATION_REQUESTED",
    });
  }

  return NextResponse.json(
    { error: `Cannot cancel a leave with status: ${leave.status}` },
    { status: 400 }
  );
}
