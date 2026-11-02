import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");

  let whereClause: any = {
    status: { in: ["APPROVED", "MANAGER_APPROVED", "PENDING"] },
  };

  // RBAC scope
  if (session.role === "EMPLOYEE") {
    // Show self + team members in same department for visibility
    if (session.departmentId) {
      whereClause.user = { departmentId: session.departmentId };
    } else {
      whereClause.userId = session.userId;
    }
  } else if (session.role === "MANAGER") {
    if (session.departmentId) {
      whereClause.user = { departmentId: session.departmentId };
    }
  } else {
    // HR and Admin can view all or filter by department
    if (departmentId && departmentId !== "ALL") {
      whereClause.user = { departmentId };
    }
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
          department: { select: { name: true, code: true } },
        },
      },
      leaveType: {
        select: { name: true, code: true, isPaid: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ events: leaves });
}
