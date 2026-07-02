"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

export type ProductInput = {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  category: string;
};

const CATEGORY_SUGGESTIONS = [
  "Elektronik",
  "Fashion",
  "Makanan & Minuman",
  "Rumah Tangga",
  "Olahraga",
  "Kecantikan",
];

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string;
  initial?: ProductInput;
}) {
  const router = useRouter();
  const isEdit = Boolean(productId);
  const [form, setForm] = useState<ProductInput>(
    initial ?? {
      name: "",
      description: "",
      price: "",
      stock: "",
      imageUrl: "",
      category: "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ProductInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit ? `/api/v1/seller/products/${productId}` : "/api/v1/seller/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal menyimpan produk");
        return;
      }
      router.push("/dashboard/seller/products");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  const previewUrl = form.imageUrl.startsWith("https://") ? form.imageUrl : null;

  return (
    <form onSubmit={submit} noValidate className="grid max-w-3xl gap-6 lg:grid-cols-[1fr_16rem]">
      <div className="space-y-5">
        <Field label="Nama Produk" htmlFor="p-name">
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="cth: Headphone Bluetooth Pro"
            maxLength={80}
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Harga (Rp)" htmlFor="p-price">
            <Input
              id="p-price"
              type="number"
              min={500}
              step={1}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="cth: 150000"
              required
            />
          </Field>
          <Field label="Stok" htmlFor="p-stock">
            <Input
              id="p-stock"
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              placeholder="cth: 25"
              required
            />
          </Field>
        </div>
        <Field label="Kategori (opsional)" htmlFor="p-category">
          <>
            <Input
              id="p-category"
              list="category-suggestions"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="cth: Elektronik"
              maxLength={40}
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </>
        </Field>
        <Field
          label="URL Gambar (opsional)"
          htmlFor="p-image"
          hint="Gunakan tautan gambar https, mis. dari Unsplash"
        >
          <Input
            id="p-image"
            type="url"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://images.unsplash.com/…"
          />
        </Field>
        <Field label="Deskripsi" htmlFor="p-desc">
          <Textarea
            id="p-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Jelaskan keunggulan produkmu…"
            className="min-h-32"
            maxLength={2000}
            required
          />
        </Field>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/seller/products")}
          >
            Batal
          </Button>
        </div>
      </div>

      <aside>
        <p className="mb-1.5 text-sm font-medium text-ink-700">Pratinjau Gambar</p>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-950/5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Pratinjau produk"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-ink-400">
              Pratinjau akan tampil setelah URL gambar diisi
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
