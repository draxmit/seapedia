"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Buyer-only purchase control. Handles the single-store cart conflict:
 * when the API reports a different store in the cart (409), the buyer is
 * offered to clear the cart and retry.
 */
export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [added, setAdded] = useState(false);

  async function add(clearFirst = false) {
    setBusy(true);
    setError(null);
    setConflict(false);
    try {
      if (clearFirst) {
        await fetch("/api/v1/cart", { method: "DELETE" });
      }
      const res = await fetch("/api/v1/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      const body = await res.json();
      if (res.status === 409) {
        setConflict(true);
        setError(body.error);
        return;
      }
      if (!res.ok) {
        setError(body.error ?? "Gagal menambahkan ke keranjang");
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  if (stock === 0) {
    return (
      <p className="rounded-xl bg-ink-100 px-4 py-3 text-sm font-semibold text-ink-500">
        Stok produk ini sedang habis
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-ink-200">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-lg font-bold text-ink-600 transition-colors hover:text-brand-700 disabled:opacity-40"
            disabled={qty <= 1}
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-bold text-ink-900">{qty}</span>
          <button
            type="button"
            aria-label="Tambah jumlah"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-lg font-bold text-ink-600 transition-colors hover:text-brand-700 disabled:opacity-40"
            disabled={qty >= stock}
          >
            +
          </button>
        </div>
        <span className="text-xs text-ink-400">Tersisa {stock} stok</span>
      </div>

      <Button onClick={() => add()} disabled={busy} className="w-full" size="lg">
        {busy ? "Menambahkan…" : added ? "✓ Masuk Keranjang" : "+ Keranjang"}
      </Button>

      {error && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-600/20">
          <p className="text-sm font-medium text-amber-800">{error}</p>
          {conflict && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => add(true)}
              disabled={busy}
            >
              Kosongkan keranjang & tambahkan produk ini
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
