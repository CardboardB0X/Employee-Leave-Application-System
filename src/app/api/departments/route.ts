import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ departments });
}
