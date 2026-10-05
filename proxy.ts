import { NextResponse, type NextRequest } from "next/server";

import { DEVELOPMENT_SESSION_COOKIE } from "@/lib/auth/constants";
import { getSessionUserId } from "@/lib/auth/dev-session-api";

export function proxy(request: NextRequest) {
  const userId = getSessionUserId(request.cookies.get(DEVELOPMENT_SESSION_COOKIE)?.value ?? undefined);
  if (request.nextUrl.pathname === "/login") {
    if (userId) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/suppliers/:path*",
    "/requirements/:path*",
    "/matching/:path*",
    "/outreach/:path*",
    "/follow-ups/:path*",
    "/deals/:path*",
    "/documents/:path*",
    "/shipments/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
  ],
};
