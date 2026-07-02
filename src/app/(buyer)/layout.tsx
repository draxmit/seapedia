import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

/** Cart & checkout: buyer-only area, enforced server-side. */
export default async function BuyerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/cart");
  if (!auth.activeRole) redirect("/pilih-peran");
  if (auth.activeRole !== "BUYER") redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
