"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const roleMeta: Record<string, { description: string; icon: React.ReactNode }> = {
  BUYER: {
    description: "Belanja produk, kelola dompet & alamat, dan lacak pesanan.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
        />
      </svg>
    ),
  },
  SELLER: {
    description: "Kelola toko, produk, pesanan masuk, dan pendapatan.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72"
        />
      </svg>
    ),
  },
  DRIVER: {
    description: "Cari job pengiriman, antar pesanan, dan lihat penghasilan.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
  },
};

export function RolePicker({
  roles,
  current,
  nextPath,
}: {
  roles: RoleName[];
  current: RoleName | null;
  nextPath?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<RoleName | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: RoleName) {
    setBusy(role);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/active-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal memilih peran");
        return;
      }
      router.push(nextPath ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => choose(role)}
            disabled={busy !== null}
            className={cn(
              "group cursor-pointer rounded-3xl border-2 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:pointer-events-none disabled:opacity-60",
              current === role
                ? "border-brand-600"
                : "border-transparent shadow-card ring-1 ring-ink-950/5 hover:border-brand-300",
            )}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/10 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              {roleMeta[role]?.icon}
            </span>
            <span className="mt-4 flex items-center gap-2">
              <span className="text-lg font-extrabold text-ink-950">
                {ROLE_LABELS[role]}
              </span>
              {current === role && <Badge tone="brand">Aktif</Badge>}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-500">
              {roleMeta[role]?.description}
            </span>
            <span className="mt-4 block text-sm font-bold text-brand-700">
              {busy === role ? "Memproses…" : "Pilih peran ini →"}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
