import type { Metadata } from "next";
import { listOrdersAdmin } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin — Pesanan" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminOrdersPage() {
  const orders = await listOrdersAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Pesanan ({orders.length})
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Seluruh pesanan beserta status dan rincian finansialnya.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Pembeli → Toko</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Kirim</th>
                <th className="px-5 py-3 text-right">Diskon</th>
                <th className="px-5 py-3 text-right">PPN</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-ink-900">
                    {o.code}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-ink-800">{o.buyer.name}</p>
                    <p className="text-xs text-ink-400">→ {o.store.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="ink">{DELIVERY_METHOD_LABELS[o.deliveryMethod]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-ink-600">
                    {o.discountAmount > 0 ? `−${formatIDR(o.discountAmount)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-600">
                    {formatIDR(o.taxAmount)}
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold text-ink-950">
                    {formatIDR(o.total)}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-400">
                    {dateFmt.format(o.createdAt)}
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
