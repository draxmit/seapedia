"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/seller/products/${productId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal menghapus produk");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="hidden text-xs text-ink-500 xl:block">Hapus?</span>
        <Button variant="danger" size="sm" onClick={remove} disabled={busy}>
          {busy ? "…" : "Ya"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={busy}
        >
          Batal
        </Button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={`Hapus ${productName}`}
      className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
    >
      Hapus
    </button>
  );
}
