import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/server/page-guards";
import { getBuyerReport } from "@/server/services/report-service";
import { formatIDR } from "@/lib/money";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Laporan Belanja" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function BuyerReportPage() {
  const auth = await requirePageRole("BUYER");
  const { orders, summary } = await getBuyerReport(auth.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Laporan Belanja
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Ringkasan pengeluaranmu di SEAPEDIA beserta rinciannya.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Belanja" value={formatIDR(summary.totalSpent)} accent />
        <SummaryCard label="Total Pesanan" value={`${summary.totalOrders} pesanan`} />
        <SummaryCard label="Hemat dari Diskon" value={formatIDR(summary.totalDiscount)} />
        <SummaryCard
          label="Dana Dikembalikan"
          value={formatIDR(summary.totalRefunded)}
          sub={`${summary.refundedOrders} pesanan direfund`}
        />
      </section>

      <Card>
        <CardHeader
          title="Rincian per Pesanan"
          subtitle="Subtotal, diskon, ongkir, PPN 12%, dan total selalu ditampilkan"
        />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Belum ada transaksi" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                    <th className="px-5 py-3">Pesanan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                    <th className="px-5 py-3 text-right">Diskon</th>
                    <th className="px-5 py-3 text-right">Ongkir</th>
                    <th className="px-5 py-3 text-right">PPN 12%</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="font-mono text-xs font-bold text-brand-700 hover:underline"
                        >
                          {o.code}
                        </Link>
                        <p className="text-xs text-ink-400">
                          {o.store.name} · {dateFmt.format(o.createdAt)}
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
                          <span className="font-semibold text-brand-700">
                            −{formatIDR(o.discountAmount)}
                          </span>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-700">
                        {formatIDR(o.deliveryFee)}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-700">
                        {formatIDR(o.taxAmount)}
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-ink-950">
                        {formatIDR(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lift"
          : "rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5"
      }
    >
      <p className={accent ? "text-xs font-semibold text-brand-100" : "text-xs font-semibold text-ink-500"}>
        {label}
      </p>
      <p className="mt-1.5 text-xl font-extrabold tracking-tight">{value}</p>
      {sub && (
        <p className={accent ? "mt-1 text-xs text-brand-200" : "mt-1 text-xs text-ink-400"}>
          {sub}
        </p>
      )}
    </div>
  );
}
