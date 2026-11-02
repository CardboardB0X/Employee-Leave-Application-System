import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_default_super_secret_key_leave_system_32"
);

const AUTH_COOKIE_NAME = "auth_session_token";

function getTargetUrl(path: string, req: NextRequest): URL {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return new URL(path, `${proto}://${host}`);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session: any = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload;
    } catch {
      session = null;
    }
  }

  // 1. Root path routing
  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(getTargetUrl("/dashboard", req));
    }
    return NextResponse.redirect(getTargetUrl("/login", req));
  }

  // 2. Protect /dashboard and all subroutes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = getTargetUrl("/login", req);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-specific protected paths
    if (
      pathname.startsWith("/dashboard/users") &&
      !["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)
    ) {
      return NextResponse.redirect(getTargetUrl("/dashboard?error=unauthorized", req));
    }

    if (
      pathname.startsWith("/dashboard/leave-types") &&
      !["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)
    ) {
      return NextResponse.redirect(getTargetUrl("/dashboard?error=unauthorized", req));
    }

    if (
      pathname.startsWith("/dashboard/balances") &&
      !["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)
    ) {
      return NextResponse.redirect(getTargetUrl("/dashboard?error=unauthorized", req));
    }

    if (
      pathname.startsWith("/dashboard/audit-logs") &&
      !["SUPER_ADMIN", "HR_ADMIN"].includes(session.role)
    ) {
      return NextResponse.redirect(getTargetUrl("/dashboard?error=unauthorized", req));
    }

    if (
      pathname.startsWith("/dashboard/approvals") &&
      !["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(session.role)
    ) {
      return NextResponse.redirect(getTargetUrl("/dashboard?error=unauthorized", req));
    }

    if (
      pathname.startsWith("/dashboard/reports") &&
      !["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(session.role)
    ) {
      return NextResponse.redirect(getTargetUrl("/dashboard?error=unauthorized", req));
    }
  }

  // 3. Security response headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/logout).*)",
  ],
};
