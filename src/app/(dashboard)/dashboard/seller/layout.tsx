import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";

/** Seller area guard: requires the ACTIVE role to be SELLER (server-side). */
export default async function SellerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (auth.activeRole !== "SELLER") redirect("/dashboard");
  return <>{children}</>;
}
