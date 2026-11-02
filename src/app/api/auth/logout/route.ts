import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSessionFromRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (session) {
    try {
      await logAuditEvent({
        actorId: session.userId,
        action: "LOGOUT",
        resourceType: "AUTH",
        req,
      });
    } catch {
      // Ignore if user no longer exists in DB
    }
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const loginUrl = new URL("/login", `${proto}://${host}`);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (session) {
    try {
      await logAuditEvent({
        actorId: session.userId,
        action: "LOGOUT",
        resourceType: "AUTH",
        req,
      });
    } catch {
      // Ignore
    }
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}