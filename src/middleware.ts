import { NextRequest, NextResponse } from "next/server";

const GUEST_COOKIE = "sp_pid";
const ONE_YEAR = 60 * 60 * 24 * 365;

// Ensures every visitor has a stable anonymous player id before any page or
// API route runs. This is the "guest play" identity used across the whole
// app (profiles.id). No personal data is stored - it is a random UUID.
// The id is also injected into the forwarded request headers so that even
// the very first request (before the browser has stored the cookie) can
// read it in Server Components / Route Handlers.
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  const id = existing ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  if (!existing) {
    const prevCookie = requestHeaders.get("cookie");
    requestHeaders.set(
      "cookie",
      prevCookie ? `${prevCookie}; ${GUEST_COOKIE}=${id}` : `${GUEST_COOKIE}=${id}`,
    );
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!existing) {
    response.cookies.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
