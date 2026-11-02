import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { canApproveLeaveRequest, forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const actionSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  comments: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parseResult = actionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { action, comments } = parseResult.data;

    if (action === "REJECTED" && (!comments || comments.trim().length < 5)) {
      return NextResponse.json(
        { error: "A rejection reason with at least 5 characters is mandatory." },
        { status: 400 }
      );
    }

    // Fetch leave with user and leave type
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
            managerId: true,
          },
        },
        leaveType: true,
      },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    // Verify approval eligibility
    const eligibility = canApproveLeaveRequest(session, leave);
    if (!eligibility.canApprove) {
      return forbiddenResponse(eligibility.reason);
    }

    const fiscalYear = new Date(leave.startDate).getFullYear();
    const totalDays = Number(leave.totalDays);
    const stage = eligibility.stage || (session.role === "HR_ADMIN" ? "HR" : "MANAGER");

    // Check if this is a Cancellation Request Review
    const isCancellationReview = leave.status === "CANCELLATION_REQUESTED";

    let nextStatus: "PENDING" | "MANAGER_APPROVED" | "APPROVED" | "REJECTED" | "CANCELLED" = "APPROVED";

    if (isCancellationReview) {
      if (action === "APPROVED") {
        nextStatus = "CANCELLED"; // Cancellation approved -> leave cancelled & balance refunded
      } else {
        nextStatus = "APPROVED"; // Cancellation rejected -> leave remains active
      }
    } else {
      // Normal application review
      if (action === "REJECTED") {
        nextStatus = "REJECTED";
      } else {
        if (
          stage === "MANAGER" &&
          leave.leaveType.requiresHrApproval &&
          session.role !== "SUPER_ADMIN"
        ) {
          nextStatus = "MANAGER_APPROVED";
        } else {
          nextStatus = "APPROVED";
        }
      }
    }

    // Execute atomic ACID transaction
    await prisma.$transaction(async (tx) => {
      // 1. Balance updates
      if (isCancellationReview) {
        if (nextStatus === "CANCELLED") {
          // Refund usedDays back into available balance
          await tx.leaveBalance.updateMany({
            where: {
              userId: leave.userId,
              leaveTypeId: leave.leaveTypeId,
              fiscalYear,
            },
            data: {
              usedDays: { decrement: totalDays },
            },
          });
        }
      } else {
        if (nextStatus === "APPROVED") {
          // Decrement pendingDays and increment usedDays
          await tx.leaveBalance.updateMany({
            where: {
              userId: leave.userId,
              leaveTypeId: leave.leaveTypeId,
              fiscalYear,
            },
            data: {
              pendingDays: { decrement: totalDays },
              usedDays: { increment: totalDays },
            },
          });
        } else if (nextStatus === "REJECTED") {
          // Release pendingDays back to available pool
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
        }
      }

      // 2. Update request status
      await tx.leaveRequest.update({
        where: { id: leave.id },
        data: { status: nextStatus },
      });

      // 3. Record approval step in leave_approvals table
      await tx.leaveApproval.create({
        data: {
          leaveRequestId: leave.id,
          approverId: session.userId,
          stage,
          action,
          comments: comments ? comments.trim() : null,
        },
      });

      // 4. Notify employee
      const notifTitle = isCancellationReview
        ? action === "APPROVED"
          ? "Leave Cancellation Approved"
          : "Leave Cancellation Declined"
        : action === "APPROVED"
        ? "Leave Approved"
        : "Leave Rejected";

      const notifMessage = isCancellationReview
        ? action === "APPROVED"
          ? `Your cancellation request for ${leave.requestNumber} was approved. ${totalDays} days have been restored to your leave balance.`
          : `Your cancellation request for ${leave.requestNumber} was declined by ${session.firstName} ${session.lastName}.${comments ? ` Note: "${comments}"` : ""}`
        : `Your request (${leave.requestNumber}) was ${nextStatus.toLowerCase().replace("_", " ")} by ${session.firstName} ${session.lastName}.${comments ? ` Note: "${comments}"` : ""}`;

      await tx.notification.create({
        data: {
          userId: leave.userId,
          title: notifTitle,
          message: notifMessage,
          type: action === "APPROVED" ? "SUCCESS" : "WARNING",
          link: "/dashboard",
        },
      });
    });

    // 5. Audit logging
    await logAuditEvent({
      actorId: session.userId,
      action: isCancellationReview
        ? `LEAVE_CANCELLATION_${action}_BY_${stage}`
        : `LEAVE_${action}_BY_${stage}`,
      resourceType: "LEAVE_REQUEST",
      resourceId: leave.id,
      details: {
        requestNumber: leave.requestNumber,
        newStatus: nextStatus,
        comments,
        isCancellationReview,
        daysRefunded: isCancellationReview && nextStatus === "CANCELLED" ? totalDays : 0,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: isCancellationReview
        ? nextStatus === "CANCELLED"
          ? "Leave cancelled and credits restored to employee balance."
          : "Cancellation request declined. Leave remains active."
        : `Leave request has been marked as ${nextStatus}.`,
      status: nextStatus,
    });
  } catch (error: any) {
    console.error("Error processing approval action:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
