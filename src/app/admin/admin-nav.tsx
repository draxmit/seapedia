"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { label: "Ringkasan", href: "/admin", exact: true },
  { label: "Pengguna", href: "/admin/users" },
  { label: "Toko", href: "/admin/stores" },
  { label: "Produk", href: "/admin/products" },
  { label: "Pesanan", href: "/admin/orders" },
  { label: "Voucher & Promo", href: "/admin/discounts" },
  { label: "Pengiriman", href: "/admin/deliveries" },
  { label: "Pesanan Overdue", href: "/admin/overdue" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-card ring-1 ring-ink-950/5 lg:flex-col">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              active
                ? "bg-ink-950 text-white"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
