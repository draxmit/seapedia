import type { Metadata } from "next";
import { listDeliveriesAdmin } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin — Pengiriman" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const jobStatusMeta = {
  AVAILABLE: { text: "Tersedia", tone: "amber" as const },
  TAKEN: { text: "Diantar", tone: "sky" as const },
  COMPLETED: { text: "Selesai", tone: "brand" as const },
  CANCELLED: { text: "Dibatalkan", tone: "red" as const },
};

export default async function AdminDeliveriesPage() {
  const jobs = await listDeliveriesAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Job Pengiriman ({jobs.length})
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Pemantauan seluruh job driver di marketplace.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                <th className="px-5 py-3">Pesanan</th>
                <th className="px-5 py-3">Toko Asal</th>
                <th className="px-5 py-3">Status Job</th>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Metode</th>
                <th className="px-5 py-3 text-right">Upah</th>
                <th className="px-5 py-3">Selesai</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-ink-900">
                    {j.order.code}
                  </td>
                  <td className="px-5 py-3 text-ink-600">{j.order.store.name}</td>
                  <td className="px-5 py-3">
                    <Badge tone={jobStatusMeta[j.status].tone}>
                      {jobStatusMeta[j.status].text}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {j.driver ? `${j.driver.name} (@${j.driver.username})` : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {DELIVERY_METHOD_LABELS[j.order.deliveryMethod]}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {formatIDR(j.fee)}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-400">
                    {j.completedAt ? dateFmt.format(j.completedAt) : "—"}
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
