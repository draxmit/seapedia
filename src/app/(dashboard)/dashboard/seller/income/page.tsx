import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/server/page-guards";
import { getSellerReport } from "@/server/services/report-service";
import { formatIDR } from "@/lib/money";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Pendapatan Toko" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function SellerIncomePage() {
  const auth = await requirePageRole("SELLER");
  const { orders, summary } = await getSellerReport(auth.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Pendapatan Toko
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Pendapatan = subtotal − diskon, dihitung saat pesanan selesai.
          Ongkir milik driver dan PPN adalah pajak.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lift">
          <p className="text-xs font-semibold text-brand-100">Pendapatan Terkumpul</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight">
            {formatIDR(summary.totalIncome)}
          </p>
          <p className="mt-1 text-xs text-brand-200">
            dari {summary.completedOrders} pesanan selesai
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <p className="text-xs font-semibold text-ink-500">Potensi Pendapatan</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-ink-950">
            {formatIDR(summary.pendingIncome)}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {summary.inProgressOrders} pesanan masih berjalan
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <p className="text-xs font-semibold text-ink-500">Total Pesanan</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-ink-950">
            {summary.totalOrders}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <p className="text-xs font-semibold text-ink-500">Penyesuaian Refund</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-red-600">
            −{formatIDR(summary.reversedIncome)}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {summary.refundedOrders} pesanan dikembalikan
          </p>
        </div>
      </section>

      <Card>
        <CardHeader
          title="Riwayat Pesanan Toko"
          subtitle="Semua pesanan beserta kontribusi pendapatannya"
        />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Belum ada pesanan" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                    <th className="px-5 py-3">Pesanan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                    <th className="px-5 py-3 text-right">Diskon</th>
                    <th className="px-5 py-3 text-right">Pendapatan</th>
                    <th className="px-5 py-3 text-center">Kontribusi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const income = o.subtotal - o.discountAmount;
                    const counted = o.status === "PESANAN_SELESAI" && !o.incomeReversed;
                    return (
                      <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                        <td className="px-5 py-3">
                          <Link
                            href={`/dashboard/seller/orders/${o.id}`}
                            className="font-mono text-xs font-bold text-brand-700 hover:underline"
                          >
                            {o.code}
                          </Link>
                          <p className="text-xs text-ink-400">
                            {o.buyer.name} · {dateFmt.format(o.createdAt)}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-3 text-right text-ink-700">
                          {formatIDR(o.subtotal)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {o.discountAmount > 0 ? (
                            <span className="text-ink-700">−{formatIDR(o.discountAmount)}</span>
                          ) : (
                            <span className="text-ink-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-extrabold text-ink-950">
                          {formatIDR(income)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {counted ? (
                            <Badge tone="brand">Terhitung</Badge>
                          ) : o.incomeReversed ? (
                            <Badge tone="red">Dibatalkan</Badge>
                          ) : o.status === "DIKEMBALIKAN" ? (
                            <Badge tone="red">Refund</Badge>
                          ) : (
                            <Badge tone="ink">Menunggu</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
