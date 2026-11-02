import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only Super Admin and HR Admin can export security audit trails.");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const headers = [
    "Log ID",
    "Timestamp (UTC)",
    "Actor Code",
    "Actor Name",
    "Actor Email",
    "Action",
    "Resource Type",
    "Resource ID",
    "Client IP",
    "Event Details",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = logs.map((l) => [
    escapeCsv(l.id.toString()),
    escapeCsv(new Date(l.createdAt).toISOString()),
    escapeCsv(l.actor?.employeeCode || "SYSTEM"),
    escapeCsv(l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : "System / Anonymous"),
    escapeCsv(l.actor?.email || "N/A"),
    escapeCsv(l.action),
    escapeCsv(l.resourceType),
    escapeCsv(l.resourceId || ""),
    escapeCsv(l.ipAddress),
    escapeCsv(l.details || ""),
  ]);

  const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  await logAuditEvent({
    actorId: session.userId,
    action: "SECURITY_AUDIT_TRAIL_EXPORTED",
    resourceType: "AUDIT_LOG",
    details: { totalRecordsExported: logs.length },
    req,
  });

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cvsu-ceit-audit-trail-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
