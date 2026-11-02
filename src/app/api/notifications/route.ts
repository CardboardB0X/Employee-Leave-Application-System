import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.userId,
      isRead: false,
    },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const { notificationId } = body;

  if (notificationId) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.userId,
      },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: {
        userId: session.userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
