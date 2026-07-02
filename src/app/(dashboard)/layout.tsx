import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * Private dashboard shell. Server-side authorization: guests are sent to
 * login and multi-role users without an active role must choose one first
 * (the middleware mirrors this, but the layout re-checks against the DB).
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/dashboard");
  if (!auth.activeRole) redirect("/pilih-peran");
  if (auth.activeRole === "ADMIN") redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
        <Sidebar role={auth.activeRole} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
