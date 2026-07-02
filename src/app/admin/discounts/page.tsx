import type { Metadata } from "next";
import { listAllPromos, listAllVouchers } from "@/server/services/discount-service";
import { getVirtualNow } from "@/lib/time";
import { formatIDR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DiscountForms } from "./discount-forms";

export const metadata: Metadata = { title: "Admin — Voucher & Promo" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function valueLabel(valueType: "PERCENT" | "FIXED", value: number, maxDiscount: number | null) {
  return valueType === "PERCENT"
    ? `${value}%${maxDiscount ? ` (maks ${formatIDR(maxDiscount)})` : ""}`
    : formatIDR(value);
}

export default async function AdminDiscountsPage() {
  const [vouchers, promos, now] = await Promise.all([
    listAllVouchers(),
    listAllPromos(),
    getVirtualNow(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Voucher & Promo
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Voucher memiliki masa berlaku dan kuota penggunaan; promo hanya masa
          berlaku. Status kedaluwarsa mengikuti jam simulasi.
        </p>
      </header>

      <DiscountForms />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={`Voucher (${vouchers.length})`}
            subtitle="Kode dengan kuota penggunaan terbatas"
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-5 py-3">Potongan</th>
                    <th className="px-5 py-3 text-right">Kuota</th>
                    <th className="px-5 py-3">Kedaluwarsa</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => {
                    const expired = v.expiresAt < now;
                    const exhausted = v.usedCount >= v.maxUsage;
                    return (
                      <tr key={v.id} className="border-b border-ink-100 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-bold text-ink-900">{v.code}</p>
                          <p className="text-xs text-ink-400">{v.name}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-700">
                          {valueLabel(v.valueType, v.value, v.maxDiscount)}
                          {v.minSubtotal > 0 && (
                            <p className="text-xs text-ink-400">
                              min. {formatIDR(v.minSubtotal)}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-ink-700">
                          {v.usedCount}/{v.maxUsage}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-500">
                          {dateFmt.format(v.expiresAt)}
                        </td>
                        <td className="px-5 py-3">
                          {expired ? (
                            <Badge tone="red">Kedaluwarsa</Badge>
                          ) : exhausted ? (
                            <Badge tone="amber">Kuota Habis</Badge>
                          ) : (
                            <Badge tone="brand">Aktif</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={`Promo (${promos.length})`}
            subtitle="Kode dengan masa berlaku tanpa kuota"
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-110 text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-5 py-3">Potongan</th>
                    <th className="px-5 py-3">Kedaluwarsa</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => {
                    const expired = p.expiresAt < now;
                    return (
                      <tr key={p.id} className="border-b border-ink-100 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-bold text-ink-900">{p.code}</p>
                          <p className="text-xs text-ink-400">{p.name}</p>
                        </td>
                        <td className="px-5 py-3 text-ink-700">
                          {valueLabel(p.valueType, p.value, p.maxDiscount)}
                          {p.minSubtotal > 0 && (
                            <p className="text-xs text-ink-400">
                              min. {formatIDR(p.minSubtotal)}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-500">
                          {dateFmt.format(p.expiresAt)}
                        </td>
                        <td className="px-5 py-3">
                          {expired ? (
                            <Badge tone="red">Berakhir</Badge>
                          ) : (
                            <Badge tone="violet">Aktif</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
