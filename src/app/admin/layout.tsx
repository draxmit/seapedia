import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuth } from "@/server/auth";
import { getClock } from "@/server/services/admin-service";
import { Navbar } from "@/components/layout/navbar";
import { AdminNav } from "./admin-nav";
import { TimeControls } from "./time-controls";

/** Admin area: only the ADMIN role may enter — checked on the server. */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/admin");
  if (auth.activeRole !== "ADMIN") redirect("/dashboard");

  const clock = await getClock();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-xs font-extrabold text-white">
              A
            </span>
            <div>
              <p className="text-sm font-extrabold text-ink-950">Panel Admin</p>
              <p className="text-xs text-ink-400">
                Pemantauan marketplace & operasional
              </p>
            </div>
          </div>
          <TimeControls
            offsetDays={clock.offsetDays}
            virtualNow={clock.virtualNow.toISOString()}
          />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="lg:w-56 lg:shrink-0">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <footer className="border-t border-ink-100 bg-white py-4 text-center text-xs text-ink-400">
        SEAPEDIA Admin ·{" "}
        <Link href="/" className="hover:text-brand-700">
          Kembali ke marketplace
        </Link>
      </footer>
    </div>
  );
}
