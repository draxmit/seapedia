"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" });

/**
 * The Level 6 time machine: shows the simulated date, advances it one day
 * (auto-running the overdue sweep), or runs the sweep in place.
 */
export function TimeControls({
  offsetDays,
  virtualNow,
}: {
  offsetDays: number;
  virtualNow: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function call(path: string, label: string) {
    setBusy(label);
    setFlash(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        const refunded = body.data.refunded ?? [];
        setFlash(
          refunded.length > 0
            ? `${refunded.length} pesanan overdue direfund: ${refunded.join(", ")}`
            : "Tidak ada pesanan overdue yang perlu ditangani",
        );
      } else {
        setFlash(body.error ?? "Aksi gagal");
      }
      router.refresh();
    } catch {
      setFlash("Tidak dapat terhubung ke server");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-1.5 ring-1 ring-ink-950/5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-ink-400">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-bold text-ink-800">
            {dateFmt.format(new Date(virtualNow))}
          </span>
          {offsetDays > 0 && <Badge tone="violet">+{offsetDays} hari simulasi</Badge>}
        </div>
        <button
          onClick={() => call("/api/v1/admin/simulate-next-day", "sim")}
          disabled={busy !== null}
          className="cursor-pointer rounded-xl bg-ink-950 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
        >
          {busy === "sim" ? "Memproses…" : "⏭ Simulasi Hari Berikutnya"}
        </button>
        <button
          onClick={() => call("/api/v1/admin/run-overdue-check", "sweep")}
          disabled={busy !== null}
          className="cursor-pointer rounded-xl border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
        >
          {busy === "sweep" ? "Memeriksa…" : "Jalankan Cek Overdue"}
        </button>
      </div>
      {flash && (
        <p className="max-w-xl rounded-lg bg-brand-50 px-2.5 py-1 text-right text-xs font-medium text-brand-800">
          {flash}
        </p>
      )}
    </div>
  );
}
