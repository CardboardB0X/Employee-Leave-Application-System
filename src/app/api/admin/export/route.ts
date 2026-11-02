import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(session.role)) {
    return forbiddenResponse("Only Managers, HR, and Super Admin can export leave records.");
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
  const status = searchParams.get("status");

  let whereClause: any = {};

  if (session.role === "MANAGER") {
    whereClause.OR = [
      { userId: session.userId },
      { user: { managerId: session.userId } },
      ...(session.departmentId ? [{ user: { departmentId: session.departmentId } }] : []),
    ];
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
        },
      },
      leaveType: { select: { name: true, code: true } },
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

  // Build CSV content
  const headers = [
    "Request Number",
    "Employee Code",
    "Employee Name",
    "Department",
    "Leave Type",
    "Start Date",
    "End Date",
    "Total Days",
    "Status",
    "Reason",
    "Last Approver",
    "Approver Notes",
    "Submission Date",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leaves.map((l) => [
    escapeCsv(l.requestNumber),
    escapeCsv(l.user.employeeCode),
    escapeCsv(`${l.user.firstName} ${l.user.lastName}`),
    escapeCsv(l.user.department?.name || "Unassigned"),
    escapeCsv(l.leaveType.name),
    escapeCsv(new Date(l.startDate).toISOString().split("T")[0]),
    escapeCsv(new Date(l.endDate).toISOString().split("T")[0]),
    escapeCsv(l.totalDays),
    escapeCsv(l.status),
    escapeCsv(l.reason),
    escapeCsv(l.approvals[0] ? `${l.approvals[0].approver.firstName} ${l.approvals[0].approver.lastName}` : "None"),
    escapeCsv(l.approvals[0]?.comments || ""),
    escapeCsv(new Date(l.createdAt).toLocaleString()),
  ]);

  const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  await logAuditEvent({
    actorId: session.userId,
    action: "LEAVE_RECORDS_EXPORT_CSV",
    resourceType: "REPORT",
    details: { recordCount: leaves.length, year, status },
    req,
  });

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leave_report_${year}_${Date.now()}.csv"`,
    },
  });
}
