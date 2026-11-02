import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  if (!["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return forbiddenResponse("Only HR and Super Admin can inspect security audit logs.");
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

  const whereClause: any = {};
  if (action && action !== "ALL") {
    whereClause.action = { contains: action };
  }

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    include: {
      actor: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Convert BigInt id to string for JSON serialization
  const serialized = logs.map((log) => ({
    ...log,
    id: log.id.toString(),
  }));

  return NextResponse.json({ logs: serialized });
}
