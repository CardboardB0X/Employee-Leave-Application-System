import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const leaveId = params.id;

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          email: true,
          phoneNumber: true,
          emergencyContact: true,
          address: true,
          department: { select: { id: true, name: true, code: true } },
          role: { select: { name: true } },
          manager: { select: { id: true, firstName: true, lastName: true, role: { select: { name: true } } } },
        },
      },
      leaveType: true,
      approvals: {
        include: {
          approver: {
            select: { id: true, firstName: true, lastName: true, role: { select: { name: true } } },
          },
        },
        orderBy: { actionTimestamp: "desc" },
      },
    },
  });

  if (!leave) {
    return NextResponse.json({ error: "Leave application not found." }, { status: 404 });
  }

  // RBAC Scoping
  if (session.role === "EMPLOYEE" && leave.userId !== session.userId) {
    return forbiddenResponse("You can only generate CSC Form 6 for your own leave applications.");
  }

  if (
    session.role === "MANAGER" &&
    leave.userId !== session.userId &&
    leave.user.department?.id !== session.departmentId
  ) {
    return forbiddenResponse("You can only view leave applications within your department.");
  }

  // Get current year leave balances for Vacation and Sick leave certification
  const currentYear = new Date().getFullYear();
  const balances = await prisma.leaveBalance.findMany({
    where: {
      userId: leave.userId,
      fiscalYear: currentYear,
    },
    include: {
      leaveType: true,
    },
  });

  const vacationBal = balances.find((b) => b.leaveType.code === "VL") || null;
  const sickBal = balances.find((b) => b.leaveType.code === "SL") || null;

  return NextResponse.json({
    leave,
    balances: {
      vacation: vacationBal
        ? {
            total: Number(vacationBal.totalAllocated) + Number(vacationBal.carriedOver),
            used: Number(vacationBal.usedDays),
            remaining:
              Number(vacationBal.totalAllocated) +
              Number(vacationBal.carriedOver) -
              Number(vacationBal.usedDays),
          }
        : { total: 15, used: 0, remaining: 15 },
      sick: sickBal
        ? {
            total: Number(sickBal.totalAllocated) + Number(sickBal.carriedOver),
            used: Number(sickBal.usedDays),
            remaining:
              Number(sickBal.totalAllocated) +
              Number(sickBal.carriedOver) -
              Number(sickBal.usedDays),
          }
        : { total: 15, used: 0, remaining: 15 },
    },
  });
}
