import { NextRequest } from "next/server";
import prisma from "./db";

export interface AuditLogParams {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  req?: NextRequest;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent({
  actorId,
  action,
  resourceType,
  resourceId,
  details,
  req,
  ipAddress,
  userAgent,
}: AuditLogParams) {
  try {
    let clientIp = ipAddress;
    let clientUa = userAgent;

    if (req) {
      clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      clientUa = req.headers.get("user-agent") || "unknown";
    }

    let verifiedActorId = actorId || null;
    if (verifiedActorId) {
      const userExists = await prisma.user.findUnique({
        where: { id: verifiedActorId },
        select: { id: true },
      });
      if (!userExists) {
        verifiedActorId = null;
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: verifiedActorId,
        action,
        resourceType,
        resourceId: resourceId || null,
        ipAddress: clientIp || "127.0.0.1",
        userAgent: clientUa || "unknown",
        details: details || {},
      },
    });
  } catch (err) {
    console.error("Failed to write to audit log:", err);
  }
}