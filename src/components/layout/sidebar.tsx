"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type NavItem = { label: string; href: string; exact?: boolean };

/** Role-scoped dashboard navigation. */
export function getNavItems(role: RoleName): NavItem[] {
  switch (role) {
    case "BUYER":
      return [
        { label: "Ringkasan", href: "/dashboard", exact: true },
        { label: "Dompet", href: "/dashboard/wallet" },
        { label: "Alamat", href: "/dashboard/addresses" },
        { label: "Keranjang", href: "/cart" },
        { label: "Pesanan Saya", href: "/dashboard/orders" },
        { label: "Laporan Belanja", href: "/dashboard/report" },
      ];
    case "SELLER":
      return [
        { label: "Ringkasan", href: "/dashboard", exact: true },
        { label: "Toko Saya", href: "/dashboard/seller/store" },
        { label: "Produk", href: "/dashboard/seller/products" },
        { label: "Pesanan Masuk", href: "/dashboard/seller/orders" },
        { label: "Pendapatan", href: "/dashboard/seller/income" },
      ];
    case "DRIVER":
      return [
        { label: "Ringkasan", href: "/dashboard", exact: true },
        { label: "Cari Job", href: "/dashboard/driver/jobs" },
        { label: "Riwayat & Penghasilan", href: "/dashboard/driver/history" },
      ];
    case "ADMIN":
      return [{ label: "Panel Admin", href: "/admin" }];
  }
}

export function Sidebar({ role }: { role: RoleName }) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <aside className="lg:w-60 lg:shrink-0">
      <div className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink-950/5">
        <div className="mb-2 flex items-center justify-between px-2 pt-1">
          <span className="text-xs font-bold tracking-wide text-ink-400 uppercase">
            Menu
          </span>
          <Badge tone="brand">{ROLE_LABELS[role]}</Badge>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
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
                    ? "bg-brand-600 text-white shadow-card"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
