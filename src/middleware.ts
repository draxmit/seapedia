import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Edge middleware = first line of defense for private ROUTES (fast redirects
 * for a good UX). It verifies the JWT signature only; the authoritative
 * checks (session revocation, expiry, active role, resource ownership) are
 * always re-done server-side in layouts and API handlers against the
 * database. The backend never trusts this middleware alone.
 */

type TokenPayload = { sid?: string; uid?: string; activeRole?: string | null };

async function readToken(req: NextRequest): Promise<TokenPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!),
    );
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const payload = await readToken(req);

  const isLoggedIn = Boolean(payload?.sid);

  // Logged-in users don't need the auth pages
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isPrivate =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname === "/pilih-peran";

  if (!isPrivate) return NextResponse.next();

  if (!isLoggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Multi-role users must pick an active role before entering any dashboard
  if (!payload?.activeRole && pathname !== "/pilih-peran") {
    return NextResponse.redirect(new URL("/pilih-peran", req.url));
  }

  // Role-scoped area hints (authoritative checks live in the layouts/APIs)
  if (pathname.startsWith("/admin") && payload?.activeRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/cart",
    "/checkout",
    "/pilih-peran",
    "/login",
    "/register",
  ],
};
