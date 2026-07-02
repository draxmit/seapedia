import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { RoleName, Session, User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/constants";
import { ApiError } from "@/server/api";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

type TokenPayload = { sid: string; uid: string; activeRole: RoleName | null };

async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_TTL_MS))
    .sign(secret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Creates a server-side session row and sets the signed cookie.
 * The cookie only carries ids; authorization state (revocation, expiry,
 * active role) always comes from the database on each request.
 */
export async function createSession(userId: string, activeRole: RoleName | null) {
  const session = await prisma.session.create({
    data: {
      userId,
      activeRole,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  await setSessionCookie({ sid: session.id, uid: userId, activeRole });
  return session;
}

export async function setSessionCookie(payload: TokenPayload) {
  const token = await signToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type AuthContext = {
  user: User & { roles: UserRole[] };
  session: Session;
  roles: RoleName[];
  activeRole: RoleName | null;
};

/**
 * Resolves the current authenticated context, or null for guests.
 * A session is only valid when the JWT verifies AND the database row
 * is neither revoked nor expired.
 */
export async function getAuth(): Promise<AuthContext | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: { include: { roles: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const { user } = session;
  return {
    user,
    session,
    roles: user.roles.map((r) => r.role),
    activeRole: session.activeRole,
  };
}

/** Requires a logged-in user; throws 401 for guests. */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) throw new ApiError(401, "Silakan login terlebih dahulu");
  return auth;
}

/**
 * Requires the given ACTIVE role. Owning the role is not enough —
 * authorization follows the role chosen for this session.
 */
export async function requireRole(role: RoleName): Promise<AuthContext> {
  const auth = await requireAuth();
  if (auth.activeRole !== role) {
    throw new ApiError(403, `Aksi ini memerlukan peran aktif ${role}`);
  }
  return auth;
}

/** Switches the active role for the current session (server-side + cookie). */
export async function switchActiveRole(auth: AuthContext, role: RoleName) {
  if (!auth.roles.includes(role)) {
    throw new ApiError(403, "Kamu tidak memiliki peran tersebut");
  }
  await prisma.session.update({
    where: { id: auth.session.id },
    data: { activeRole: role },
  });
  await setSessionCookie({ sid: auth.session.id, uid: auth.user.id, activeRole: role });
}

/** Revokes the current session server-side and clears the cookie. */
export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.sid) {
      await prisma.session.updateMany({
        where: { id: payload.sid, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }
  await clearSessionCookie();
}
