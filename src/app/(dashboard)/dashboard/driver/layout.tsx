import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";

/** Driver area guard: requires the ACTIVE role to be DRIVER (server-side). */
export default async function DriverLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.activeRole !== "DRIVER") redirect("/dashboard");
  return <>{children}</>;
}
