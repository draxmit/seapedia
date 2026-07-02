import "server-only";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/server/api";
import {
  createSession,
  hashPassword,
  verifyPassword,
  type AuthContext,
} from "@/server/auth";
import type { z } from "zod";
import type { loginSchema, registerSchema } from "@/server/validation";

/**
 * Decides the initial active role for a fresh session:
 * - Admin accounts activate ADMIN immediately.
 * - Exactly one non-admin role -> that role.
 * - Multiple non-admin roles -> null, the user must choose one first.
 */
export function resolveInitialRole(roles: RoleName[]): RoleName | null {
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.length === 1) return roles[0];
  return null;
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const [usernameTaken, emailTaken] = await Promise.all([
    prisma.user.findUnique({ where: { username: input.username.toLowerCase() } }),
    prisma.user.findUnique({ where: { email: input.email.toLowerCase() } }),
  ]);
  if (usernameTaken) throw new ApiError(409, "Username sudah digunakan");
  if (emailTaken) throw new ApiError(409, "Email sudah terdaftar");

  const passwordHash = await hashPassword(input.password);
  const roles = [...new Set(input.roles)] as RoleName[];

  const user = await prisma.user.create({
    data: {
      username: input.username.toLowerCase(),
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      roles: { create: roles.map((role) => ({ role })) },
      // Buyer resources are provisioned up front so checkout later "just works"
      wallet: { create: { balance: 0 } },
      cart: { create: {} },
    },
    include: { roles: true },
  });

  const activeRole = resolveInitialRole(roles);
  await createSession(user.id, activeRole);

  return { user, roles, activeRole };
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  const identifier = input.identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
    include: { roles: true },
  });
  // Same message for unknown user and wrong password — no account enumeration
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError(401, "Username/email atau password salah");
  }

  const roles = user.roles.map((r) => r.role);
  const activeRole = resolveInitialRole(roles);
  await createSession(user.id, activeRole);

  return { user, roles, activeRole };
}

/** Public profile payload — never expose the password hash. */
export function toProfile(auth: AuthContext) {
  const { user, roles, activeRole } = auth;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles,
    activeRole,
    createdAt: user.createdAt,
  };
}
