import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requirePageRole } from "@/server/page-guards";
import { listSellerOrders } from "@/server/services/order-service";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Pesanan Masuk" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function SellerOrdersPage() {
  const auth = await requirePageRole("SELLER");
  const orders = await listSellerOrders(auth.user.id);
  const needsProcessing = orders.filter((o) => o.status === "SEDANG_DIKEMAS").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Pesanan Masuk
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {needsProcessing > 0
            ? `${needsProcessing} pesanan menunggu diproses.`
            : "Semua pesanan sudah diproses."}
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan masuk"
          description="Pesanan dari pembeli akan tampil di sini."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/seller/orders/${order.id}`}
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
                    Pembeli: {order.buyer.name} ·{" "}
                    {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400">Total</p>
                  <p className="text-sm font-extrabold text-ink-950">
                    {formatIDR(order.total)}
                  </p>
                </div>
              </div>
              {order.status === "SEDANG_DIKEMAS" && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/10">
                  Menunggu diproses — buka detail untuk menyelesaikan pengemasan.
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
