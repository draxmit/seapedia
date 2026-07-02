"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
      }}
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.4l3.07 3.08a.75.75 0 11-1.06 1.06l-3.07-3.07A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari produk atau toko di SEAPEDIA…"
        className="h-10 w-full rounded-xl border border-ink-200 bg-stone-50 pr-4 pl-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      />
    </form>
  );
}

type UserInfo = {
  name: string;
  username: string;
  roles: RoleName[];
  activeRole: RoleName | null;
};

export function UserMenu({ user }: { user: UserInfo }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-ink-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-28 truncate text-xs font-bold text-ink-900">
            {user.name}
          </span>
          {user.activeRole && (
            <span className="block text-[11px] font-medium text-brand-700">
              {ROLE_LABELS[user.activeRole]}
            </span>
          )}
        </span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-ink-400" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-ink-950/5"
          >
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="text-sm font-bold text-ink-900">{user.name}</p>
              <p className="text-xs text-ink-500">@{user.username}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <Badge key={r} tone={r === user.activeRole ? "brand" : "ink"}>
                    {ROLE_LABELS[r]}
                  </Badge>
                ))}
              </div>
            </div>
            <nav className="p-1.5">
              <MenuLink href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              {user.roles.filter((r) => r !== "ADMIN").length > 1 && (
                <MenuLink href="/pilih-peran" onClick={() => setOpen(false)}>
                  Ganti Peran
                </MenuLink>
              )}
              <button
                onClick={handleLogout}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                role="menuitem"
              >
                Keluar
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
    >
      {children}
    </Link>
  );
}

/** Mobile hamburger + slide-down panel. */
export function MobileMenu({ user }: { user: UserInfo | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-ink-100 bg-white px-4 pt-2 pb-4 shadow-lift md:hidden">
          <SearchBar className="mb-3" />
          <nav className="space-y-1">
            <MobileLink href="/products" onClick={() => setOpen(false)}>
              Jelajahi Produk
            </MobileLink>
            {user ? (
              <MobileLink href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MobileLink>
            ) : (
              <>
                <MobileLink href="/login" onClick={() => setOpen(false)}>
                  Masuk
                </MobileLink>
                <MobileLink href="/register" onClick={() => setOpen(false)}>
                  Daftar
                </MobileLink>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
    >
      {children}
    </Link>
  );
}
