import type { Metadata } from "next";
import { listUsersAdmin } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin — Pengguna" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await listUsersAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Pengguna ({users.length})
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Semua akun beserta peran, toko, dan aktivitasnya.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                <th className="px-5 py-3">Pengguna</th>
                <th className="px-5 py-3">Peran</th>
                <th className="px-5 py-3">Toko</th>
                <th className="px-5 py-3 text-right">Saldo Dompet</th>
                <th className="px-5 py-3 text-right">Pesanan</th>
                <th className="px-5 py-3 text-right">Job Antar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-ink-900">{u.name}</p>
                    <p className="text-xs text-ink-400">
                      @{u.username} · {u.email}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r.id} tone={r.role === "ADMIN" ? "violet" : "brand"}>
                          {ROLE_LABELS[r.role]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{u.store?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {u.wallet ? formatIDR(u.wallet.balance) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-700">{u._count.orders}</td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {u._count.deliveryJobs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
