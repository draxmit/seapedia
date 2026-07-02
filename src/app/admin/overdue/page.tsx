import type { Metadata } from "next";
import { listOverdueAdmin } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS, SLA_DAYS } from "@/lib/constants";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Admin — Pesanan Overdue" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminOverduePage() {
  const { pending, refunded, currentDay } = await listOverdueAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Pesanan Overdue
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          SLA per metode: Instant = hari yang sama, Next Day = {SLA_DAYS.NEXT_DAY} hari,
          Reguler = {SLA_DAYS.REGULAR} hari (hari simulasi). Gunakan tombol{" "}
          <strong>Simulasi Hari Berikutnya</strong> atau{" "}
          <strong>Jalankan Cek Overdue</strong> di atas untuk memproses refund
          otomatis.
        </p>
      </header>

      <Card>
        <CardHeader
          title={`Melewati SLA — menunggu penanganan (${pending.length})`}
          subtitle="Akan direfund otomatis saat pengecekan overdue berjalan"
        />
        <CardBody className="p-0">
          {pending.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Tidak ada pesanan yang melewati SLA"
                description="Semua pesanan berjalan sesuai jadwal. Coba simulasikan hari berikutnya untuk menguji skenario overdue."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-5 py-3">Pembeli → Toko</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Metode</th>
                    <th className="px-5 py-3 text-right">Terlambat</th>
                    <th className="px-5 py-3 text-right">Nilai Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((o) => (
                    <tr key={o.id} className="border-b border-ink-100 bg-red-50/40 last:border-0">
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
                        <Badge tone="ink">
                          {DELIVERY_METHOD_LABELS[o.deliveryMethod]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-red-600">
                        {currentDay - o.dueOnDay} hari
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

      <Card>
        <CardHeader
          title={`Sudah direfund otomatis (${refunded.length})`}
          subtitle="Dana kembali ke dompet pembeli, stok dipulihkan, pendapatan penjual disesuaikan"
        />
        <CardBody className="p-0">
          {refunded.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Belum ada pesanan yang direfund" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-5 py-3">Pembeli → Toko</th>
                    <th className="px-5 py-3">Metode</th>
                    <th className="px-5 py-3 text-right">Dana Dikembalikan</th>
                    <th className="px-5 py-3">Waktu Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {refunded.map((o) => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-ink-900">
                        {o.code}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-ink-800">{o.buyer.name}</p>
                        <p className="text-xs text-ink-400">→ {o.store.name}</p>
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {DELIVERY_METHOD_LABELS[o.deliveryMethod]}
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-brand-700">
                        {formatIDR(o.total)}
                      </td>
                      <td className="px-5 py-3 text-xs text-ink-400">
                        {o.refundedAt ? dateFmt.format(o.refundedAt) : "—"}
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
