import { NextResponse, type NextRequest } from "next/server";

import { DEVELOPMENT_SESSION_COOKIE } from "@/lib/auth/constants";
import { developmentSessionCookieOptions, getSessionUserId } from "@/lib/auth/dev-session-api";
import { getDefaultDevelopmentUser } from "@/lib/auth/dev-users";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const userId = getSessionUserId(request.cookies.get(DEVELOPMENT_SESSION_COOKIE)?.value);
  if (!userId) return NextResponse.json({ authenticated: false, userId: null, development: true }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ authenticated: true, userId, development: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Development authentication is disabled outside development mode." }, { status: 404 });
  const payload = await request.json().catch(() => null) as { userId?: string } | null;
  const user = payload?.userId ? getDefaultDevelopmentUser(payload.userId) : undefined;
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Select an active development user." }, { status: 400 });

  const response = NextResponse.json({ authenticated: true, userId: user.id, development: true });
  const options = developmentSessionCookieOptions();
  response.cookies.set(options.name, user.id, {
    httpOnly: options.httpOnly,
    sameSite: options.sameSite,
    secure: options.secure,
    path: options.path,
    maxAge: options.maxAge,
  });
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(DEVELOPMENT_SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
