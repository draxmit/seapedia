import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/server/page-guards";
import { getSellerOrder } from "@/server/services/order-service";
import { ApiError } from "@/server/api";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { OrderTimeline } from "@/components/order/order-timeline";
import { OrderFinancials } from "@/components/order/order-financials";
import { ProcessOrderButton } from "./process-button";

export const metadata: Metadata = { title: "Detail Pesanan Masuk" };
export const dynamic = "force-dynamic";

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requirePageRole("SELLER");
  const { id } = await params;

  let order;
  try {
    order = await getSellerOrder(auth.user.id, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const sellerIncome = order.subtotal - order.discountAmount;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl font-extrabold tracking-tight text-ink-950">
              {order.code}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Pembeli: <strong>{order.buyer.name}</strong> (@{order.buyer.username}) ·{" "}
            {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
          </p>
        </div>
        <Link
          href="/dashboard/seller/orders"
          className="text-sm font-semibold text-ink-500 hover:text-ink-800"
        >
          ← Pesanan Masuk
        </Link>
      </header>

      {order.status === "SEDANG_DIKEMAS" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-600/20">
          <div>
            <p className="font-bold text-amber-900">Pesanan menunggu diproses</p>
            <p className="mt-0.5 text-sm text-amber-800/80">
              Setelah selesai mengemas, proses pesanan agar driver dapat
              mengambil job pengirimannya.
            </p>
          </div>
          <ProcessOrderButton orderId={order.id} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Barang Pesanan" />
            <CardBody className="p-0">
              <ul className="divide-y divide-ink-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3.5 px-5 py-3.5">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-ink-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-ink-500">
                        {item.quantity} × {formatIDR(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-ink-950">
                      {formatIDR(item.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Riwayat Status"
              subtitle="Perjalanan pesanan dengan stempel waktu"
            />
            <CardBody>
              <OrderTimeline history={order.statusHistory} />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Rincian Transaksi" />
            <CardBody>
              <OrderFinancials
                subtotal={order.subtotal}
                discountAmount={order.discountAmount}
                discountCode={order.discountCode}
                discountKind={order.discountKind}
                taxAmount={order.taxAmount}
                deliveryFee={order.deliveryFee}
                total={order.total}
              />
              <p className="mt-3 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-600/10">
                Pendapatan tokomu:{" "}
                <strong>{formatIDR(sellerIncome)}</strong>
                <span className="mt-0.5 block text-xs text-brand-800/70">
                  Subtotal − diskon. Dihitung saat pesanan selesai.
                </span>
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tujuan Pengiriman" />
            <CardBody>
              <p className="text-sm font-bold text-ink-900">{order.recipient}</p>
              <p className="text-sm text-ink-600">{order.phone}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                {order.fullAddress}
              </p>
              {order.deliveryJob?.driver && (
                <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900 ring-1 ring-sky-600/10">
                  Driver: <strong>{order.deliveryJob.driver.name}</strong>
                </p>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
