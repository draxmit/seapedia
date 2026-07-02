"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  quantity: number;
  product: {
    name: string;
    slug: string;
    price: number;
    stock: number;
    imageUrl: string | null;
  };
};

export function CartItems({
  storeName,
  storeSlug,
  subtotal,
  items,
}: {
  storeName: string;
  storeSlug: string;
  subtotal: number;
  items: Item[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateQty(itemId: string, quantity: number) {
    setBusyId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Gagal mengubah jumlah");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    setError(null);
    try {
      await fetch(`/api/v1/cart/items/${itemId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function clearAll() {
    setBusyId("all");
    try {
      await fetch("/api/v1/cart", { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-2xl bg-white shadow-card ring-1 ring-ink-950/5">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <Link
            href={`/stores/${storeSlug}`}
            className="flex items-center gap-2 text-sm font-bold text-ink-900 hover:text-brand-700"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-extrabold text-white">
              {storeName.slice(0, 1)}
            </span>
            {storeName}
          </Link>
          <button
            onClick={clearAll}
            disabled={busyId !== null}
            className="cursor-pointer text-xs font-bold text-red-600 hover:underline"
          >
            Kosongkan Keranjang
          </button>
        </div>

        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 px-5 py-4">
              <Link
                href={`/products/${item.product.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100"
              >
                {item.product.imageUrl && (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="line-clamp-1 text-sm font-semibold text-ink-900 hover:text-brand-700"
                >
                  {item.product.name}
                </Link>
                <p className="mt-0.5 text-sm font-extrabold text-ink-950">
                  {formatIDR(item.product.price)}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-ink-200">
                    <button
                      aria-label="Kurangi"
                      disabled={busyId !== null || item.quantity <= 1}
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center font-bold text-ink-600 hover:text-brand-700 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      aria-label="Tambah"
                      disabled={busyId !== null || item.quantity >= item.product.stock}
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center font-bold text-ink-600 hover:text-brand-700 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={busyId !== null}
                    className="cursor-pointer text-xs font-bold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-ink-400">Subtotal</p>
                <p className="text-sm font-extrabold text-ink-950">
                  {formatIDR(item.product.price * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside>
        <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <h2 className="font-bold text-ink-900">Ringkasan Belanja</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">
                Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} barang)
              </dt>
              <dd className="font-bold text-ink-950">{formatIDR(subtotal)}</dd>
            </div>
            <p className="text-xs text-ink-400">
              Ongkir, diskon, dan PPN 12% dihitung saat checkout.
            </p>
          </dl>
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={() => router.push("/checkout")}
            disabled={busyId !== null}
          >
            Lanjut ke Checkout
          </Button>
        </div>
      </aside>
    </div>
  );
}
