import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { getAdminSummary } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin — Ringkasan" };
export const dynamic = "force-dynamic";

export default async function AdminSummaryPage() {
  const summary = await getAdminSummary();
  const c = summary.counts;

  const cards = [
    { label: "Pengguna", value: c.users, href: "/admin/users" },
    { label: "Toko", value: c.stores, href: "/admin/stores" },
    { label: "Produk Aktif", value: c.products, href: "/admin/products" },
    { label: "Pesanan", value: c.orders, href: "/admin/orders" },
    { label: "Voucher", value: c.vouchers, href: "/admin/discounts" },
    { label: "Promo", value: c.promos, href: "/admin/discounts" },
    { label: "Job Pengiriman", value: c.deliveryJobs, href: "/admin/deliveries" },
    {
      label: "Pesanan Overdue",
      value: c.overdueOrders,
      href: "/admin/overdue",
      alert: c.overdueOrders > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Ringkasan Marketplace
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Pantauan menyeluruh atas seluruh entitas SEAPEDIA.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={
              card.alert
                ? "rounded-2xl bg-red-50 p-5 ring-2 ring-red-500/60 transition-shadow hover:shadow-lift"
                : "rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5 transition-shadow hover:shadow-lift"
            }
          >
            <p
              className={
                card.alert
                  ? "text-xs font-semibold text-red-700"
                  : "text-xs font-semibold text-ink-500"
              }
            >
              {card.label}
              {card.alert && " ⚠"}
            </p>
            <p
              className={
                card.alert
                  ? "mt-1.5 text-2xl font-extrabold tracking-tight text-red-700"
                  : "mt-1.5 text-2xl font-extrabold tracking-tight text-ink-950"
              }
            >
              {card.value}
            </p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pesanan per Status"
            subtitle="Distribusi siklus hidup pesanan saat ini"
          />
          <CardBody>
            <ul className="space-y-2.5">
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
                <li
                  key={status}
                  className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5 ring-1 ring-ink-950/5"
                >
                  <StatusBadge status={status} />
                  <span className="text-sm font-extrabold text-ink-950">
                    {summary.ordersByStatus[status] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Keuangan Marketplace"
            subtitle="Akumulasi dari pesanan yang tidak direfund"
          />
          <CardBody>
            <dl className="space-y-3">
              <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white">
                <dt className="text-xs font-semibold text-brand-100">
                  Volume Transaksi Kotor
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tracking-tight">
                  {formatIDR(summary.finance.grossVolume)}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-stone-50 p-4 ring-1 ring-ink-950/5">
                  <dt className="text-xs font-semibold text-ink-500">PPN Terkumpul</dt>
                  <dd className="mt-1 text-lg font-extrabold text-ink-950">
                    {formatIDR(summary.finance.taxCollected)}
                  </dd>
                </div>
                <div className="rounded-xl bg-stone-50 p-4 ring-1 ring-ink-950/5">
                  <dt className="text-xs font-semibold text-ink-500">Diskon Diberikan</dt>
                  <dd className="mt-1 text-lg font-extrabold text-ink-950">
                    {formatIDR(summary.finance.discountGiven)}
                  </dd>
                </div>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
