import type { Metadata } from "next";
import Link from "next/link";
import { listProductsAdmin } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin — Produk" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProductsAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Produk ({products.length})
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Seluruh produk aktif di katalog marketplace.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                <th className="px-5 py-3">Produk</th>
                <th className="px-5 py-3">Toko</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-right">Harga</th>
                <th className="px-5 py-3 text-right">Stok</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3">
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{p.store.name}</td>
                  <td className="px-5 py-3 text-ink-600">{p.category ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {formatIDR(p.price)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.stock === 0 ? (
                      <Badge tone="red">Habis</Badge>
                    ) : (
                      <span className="text-ink-700">{p.stock}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
