import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only Super Admin and HR Admin can execute statutory leave accruals.");
  }

  try {
    const currentYear = new Date().getFullYear();
    const currentMonthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());

    // 1. Fetch active personnel
    const activeUsers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    });

    if (activeUsers.length === 0) {
      return NextResponse.json({ message: "No active personnel found." });
    }

    // 2. Fetch VL and SL leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        code: { in: ["VL", "SL"] },
        isActive: true,
      },
    });

    const vlType = leaveTypes.find((lt) => lt.code === "VL");
    const slType = leaveTypes.find((lt) => lt.code === "SL");

    if (!vlType && !slType) {
      return NextResponse.json(
        { error: "Statutory Vacation Leave (VL) and Sick Leave (SL) categories not found." },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const u of activeUsers) {
        // Accrue Vacation Leave
        if (vlType) {
          const existingVl = await tx.leaveBalance.findUnique({
            where: {
              uk_user_leave_year: {
                userId: u.id,
                leaveTypeId: vlType.id,
                fiscalYear: currentYear,
              },
            },
          });

          if (existingVl) {
            await tx.leaveBalance.update({
              where: { id: existingVl.id },
              data: {
                totalAllocated: { increment: 1.25 },
              },
            });
          } else {
            await tx.leaveBalance.create({
              data: {
                userId: u.id,
                leaveTypeId: vlType.id,
                fiscalYear: currentYear,
                totalAllocated: 1.25,
                usedDays: 0,
                pendingDays: 0,
                carriedOver: 0,
              },
            });
          }
        }

        // Accrue Sick Leave
        if (slType) {
          const existingSl = await tx.leaveBalance.findUnique({
            where: {
              uk_user_leave_year: {
                userId: u.id,
                leaveTypeId: slType.id,
                fiscalYear: currentYear,
              },
            },
          });

          if (existingSl) {
            await tx.leaveBalance.update({
              where: { id: existingSl.id },
              data: {
                totalAllocated: { increment: 1.25 },
              },
            });
          } else {
            await tx.leaveBalance.create({
              data: {
                userId: u.id,
                leaveTypeId: slType.id,
                fiscalYear: currentYear,
                totalAllocated: 1.25,
                usedDays: 0,
                pendingDays: 0,
                carriedOver: 0,
              },
            });
          }
        }

        // Create notification for employee
        await tx.notification.create({
          data: {
            userId: u.id,
            title: `Statutory Accrual (${currentMonthName} ${currentYear})`,
            message: `Monthly civil service leave credits of +1.25 days Vacation Leave and +1.25 days Sick Leave have been credited to your account.`,
            type: "SUCCESS",
            link: "/dashboard/profile",
          },
        });

        updatedCount++;
      }
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "STATUTORY_MONTHLY_ACCRUAL_EXECUTED",
      resourceType: "BALANCE",
      details: {
        month: currentMonthName,
        fiscalYear: currentYear,
        employeesAccrued: updatedCount,
        rates: "+1.25 VL, +1.25 SL",
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Statutory monthly accrual of +1.25 VL and +1.25 SL successfully credited to ${updatedCount} active personnel for ${currentMonthName} ${currentYear}.`,
      count: updatedCount,
    });
  } catch (error: any) {
    console.error("Accrual execution error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process monthly accrual." },
      { status: 500 }
    );
  }
}
