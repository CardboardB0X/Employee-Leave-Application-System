import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  AUTH_COOKIE_NAME,
  comparePassword,
  createSessionToken,
  handleFailedLogin,
  resetFailedLogin,
} from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Fetch user with role and department
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user) {
      // Intentionally generic error to prevent email enumeration
      await logAuditEvent({
        action: "LOGIN_FAILED_UNKNOWN_EMAIL",
        resourceType: "AUTH",
        details: { attemptedEmail: email },
        req,
      });
      return NextResponse.json(
        { error: "Invalid email or password credentials." },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      await logAuditEvent({
        actorId: user.id,
        action: "LOGIN_BLOCKED_INACTIVE",
        resourceType: "AUTH",
        details: { status: user.status },
        req,
      });
      return NextResponse.json(
        { error: `Account is ${user.status.toLowerCase()}. Please contact HR or System Administrator.` },
        { status: 403 }
      );
    }

    // Check lockout timer
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      await logAuditEvent({
        actorId: user.id,
        action: "LOGIN_BLOCKED_LOCKED",
        resourceType: "AUTH",
        details: { minutesRemaining },
        req,
      });
      return NextResponse.json(
        {
          error: `Account is temporarily locked due to multiple failed attempts. Please retry in ${minutesRemaining} minute(s).`,
        },
        { status: 429 }
      );
    }

    // Validate password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const { isLocked, lockUntil } = await handleFailedLogin(
        user.id,
        user.failedLoginAttempts
      );

      await logAuditEvent({
        actorId: user.id,
        action: isLocked ? "ACCOUNT_LOCKED_BRUTE_FORCE" : "LOGIN_FAILED_PASSWORD",
        resourceType: "AUTH",
        details: { failedAttempts: user.failedLoginAttempts + 1, isLocked },
        req,
      });

      if (isLocked) {
        return NextResponse.json(
          {
            error:
              "Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.",
          },
          { status: 429 }
        );
      }

      const remainingAttempts = 5 - (user.failedLoginAttempts + 1);
      return NextResponse.json(
        {
          error: `Invalid email or password credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`,
        },
        { status: 401 }
      );
    }

    // Reset failed counter on successful authentication
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await resetFailedLogin(user.id);
    }

    // Generate JWT token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name as any,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
    });

    // Record login audit
    await logAuditEvent({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      resourceType: "AUTH",
      details: { role: user.role.name },
      req,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        employeeCode: user.employeeCode,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        department: user.department ? user.department.name : null,
      },
    });

    // Set secure HttpOnly cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during authentication." },
      { status: 500 }
    );
  }
}
