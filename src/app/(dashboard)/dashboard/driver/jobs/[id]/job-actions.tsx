"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/money";

export function JobActions({
  jobId,
  status,
  isMine,
  fee,
}: {
  jobId: string;
  status: "AVAILABLE" | "TAKEN" | "COMPLETED" | "CANCELLED";
  isMine: boolean;
  fee: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "take" | "complete") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/driver/jobs/${jobId}/${action}`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Aksi gagal");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  if (status === "COMPLETED") {
    return (
      <div className="rounded-2xl bg-brand-50 px-5 py-4 ring-1 ring-brand-600/20">
        <p className="font-bold text-brand-900">✓ Job selesai</p>
        <p className="mt-0.5 text-sm text-brand-800/80">
          Upah {formatIDR(fee)} sudah masuk ke penghasilanmu.
        </p>
      </div>
    );
  }

  if (status === "TAKEN" && isMine) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sky-50 px-5 py-4 ring-1 ring-sky-600/20">
        <div>
          <p className="font-bold text-sky-900">Pesanan sedang kamu antar</p>
          <p className="mt-0.5 text-sm text-sky-800/80">
            Sudah sampai ke penerima? Konfirmasi untuk menyelesaikan job.
          </p>
        </div>
        <div className="text-right">
          <Button onClick={() => act("complete")} disabled={busy} size="lg">
            {busy ? "Memproses…" : "Konfirmasi Pesanan Sampai ✓"}
          </Button>
          {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
        </div>
      </div>
    );
  }

  if (status === "AVAILABLE") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-card ring-1 ring-ink-950/5">
        <div>
          <p className="font-bold text-ink-900">Job ini masih tersedia</p>
          <p className="mt-0.5 text-sm text-ink-500">
            Ambil sekarang dan dapatkan {formatIDR(fee)} setelah pengantaran selesai.
          </p>
        </div>
        <div className="text-right">
          <Button onClick={() => act("take")} disabled={busy} size="lg">
            {busy ? "Memproses…" : "Ambil Job Ini"}
          </Button>
          {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
        </div>
      </div>
    );
  }

  return null;
}
