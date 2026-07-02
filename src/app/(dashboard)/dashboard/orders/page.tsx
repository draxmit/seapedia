import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requirePageRole } from "@/server/page-guards";
import { listBuyerOrders } from "@/server/services/order-service";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Pesanan Saya" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function BuyerOrdersPage() {
  const auth = await requirePageRole("BUYER");
  const orders = await listBuyerOrders(auth.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Pesanan Saya
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Riwayat pesanan beserta status terkininya.
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          description="Pesananmu akan muncul di sini setelah checkout pertama."
          action={
            <Link
              href="/products"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Mulai Belanja
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="block rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5 transition-shadow hover:shadow-lift"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-ink-900">
                    {order.code}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <span className="text-xs text-ink-400">
                  {dateFmt.format(order.createdAt)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="relative h-11 w-11 overflow-hidden rounded-lg bg-ink-100 ring-2 ring-white"
                    >
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-ink-800">
                    {order.items.map((i) => i.productName).join(", ")}
                  </p>
                  <p className="text-xs text-ink-500">
                    {order.store.name} · {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400">Total</p>
                  <p className="text-sm font-extrabold text-ink-950">
                    {formatIDR(order.total)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
