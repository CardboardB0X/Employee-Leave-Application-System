import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { comparePassword, getSessionFromRequest, hashPassword } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[a-z]/, "Must include at least one lowercase letter")
    .regex(/[0-9]/, "Must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Must include at least one special character"),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parseResult = passwordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return unauthorizedResponse();
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect current password entered." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      action: "PASSWORD_CHANGED",
      resourceType: "AUTH",
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Password successfully updated.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
