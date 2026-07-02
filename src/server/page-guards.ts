import "server-only";
import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { getAuth, type AuthContext } from "@/server/auth";

/**
 * Server-side page guard: requires a logged-in user whose ACTIVE role
 * matches. Pages never rely on middleware alone.
 */
export async function requirePageRole(role: RoleName): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.activeRole) redirect("/pilih-peran");
  if (auth.activeRole !== role) redirect(role === "ADMIN" ? "/dashboard" : "/dashboard");
  return auth;
}
