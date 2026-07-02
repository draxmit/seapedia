"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProcessOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function process() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/seller/orders/${orderId}/process`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal memproses pesanan");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <Button onClick={process} disabled={busy} size="lg">
        {busy ? "Memproses…" : "Proses Pesanan →"}
      </Button>
      {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
