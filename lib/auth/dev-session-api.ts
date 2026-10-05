import { DEVELOPMENT_SESSION_COOKIE } from "@/lib/auth/constants";
import { getDefaultDevelopmentUser } from "@/lib/auth/dev-users";

export function getSessionUserId(cookieValue?: string): string | null {
  if (process.env.NODE_ENV !== "development" || !cookieValue) return null;
  const user = getDefaultDevelopmentUser(cookieValue);
  return user?.status === "ACTIVE" ? user.id : null;
}

export function developmentSessionCookieOptions() {
  return {
    name: DEVELOPMENT_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}
