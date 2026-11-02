import { NextResponse } from "next/server";
import { UserSessionPayload } from "./auth";
import prisma from "./db";

export type AppRole = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  SUPER_ADMIN: 40,
  HR_ADMIN: 30,
  MANAGER: 20,
  EMPLOYEE: 10,
};

export function hasMinimumRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAuthorized(userRole: AppRole, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// BOLA / IDOR Verification for Leave Requests
export async function canAccessLeaveRequest(
  user: UserSessionPayload,
  leaveRequestId: string
): Promise<{ allowed: boolean; leave?: any; reason?: string }> {
  // Super Admin and HR Admin can view all requests
  if (user.role === "SUPER_ADMIN" || user.role === "HR_ADMIN") {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            department: true,
            managerId: true,
          },
        },
        leaveType: true,
        approvals: {
          include: {
            approver: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { actionTimestamp: "asc" },
        },
      },
    });
    if (!leave) return { allowed: false, reason: "Leave request not found" };
    return { allowed: true, leave };
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeCode: true,
          departmentId: true,
          department: true,
          managerId: true,
        },
      },
      leaveType: true,
      approvals: {
        include: {
          approver: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { actionTimestamp: "asc" },
      },
    },
  });

  if (!leave) return { allowed: false, reason: "Leave request not found" };

  // Owner can always access own leave
  if (leave.userId === user.userId) {
    return { allowed: true, leave };
  }

  // Manager can access if they manage the requester directly OR are in the same department as manager
  if (user.role === "MANAGER") {
    const isDirectManager = leave.user.managerId === user.userId;
    const isSameDept = user.departmentId && leave.user.departmentId === user.departmentId;

    if (isDirectManager || isSameDept) {
      return { allowed: true, leave };
    }
  }

  return { allowed: false, reason: "Forbidden: You do not have permission to access this resource" };
}

// Check if user is eligible to approve a leave request
export function canApproveLeaveRequest(
  user: UserSessionPayload,
  leaveRequest: any
): { canApprove: boolean; stage?: "MANAGER" | "HR"; reason?: string } {
  if (leaveRequest.status === "APPROVED" || leaveRequest.status === "REJECTED" || leaveRequest.status === "CANCELLED") {
    return { canApprove: false, reason: "Request has already been finalized" };
  }

  // Requester cannot approve their own leave
  if (leaveRequest.userId === user.userId) {
    return { canApprove: false, reason: "Self-approval is strictly forbidden" };
  }

  // Super Admin can approve at any stage
  if (user.role === "SUPER_ADMIN") {
    return {
      canApprove: true,
      stage: leaveRequest.status === "MANAGER_APPROVED" ? "HR" : "MANAGER",
    };
  }

  // HR Admin can approve if it requires HR approval or is in MANAGER_APPROVED stage
  if (user.role === "HR_ADMIN") {
    if (leaveRequest.status === "MANAGER_APPROVED" || leaveRequest.leaveType.requiresHrApproval) {
      return { canApprove: true, stage: "HR" };
    }
    // HR can also act as general manager if unassigned
    return { canApprove: true, stage: "MANAGER" };
  }

  // Department Manager
  if (user.role === "MANAGER") {
    const isDirectManager = leaveRequest.user.managerId === user.userId;
    const isSameDept = user.departmentId && leaveRequest.user.departmentId === user.departmentId;

    if (isDirectManager || isSameDept) {
      if (leaveRequest.status === "PENDING" || leaveRequest.status === "CANCELLATION_REQUESTED") {
        return { canApprove: true, stage: "MANAGER" };
      }
      return { canApprove: false, reason: "Leave is already manager-approved and awaiting HR clearance" };
    }
  }

  return { canApprove: false, reason: "Unauthorized: You are not authorized to approve this request" };
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden: Insufficient permissions") {
  return NextResponse.json({ error: message }, { status: 403 });
}
