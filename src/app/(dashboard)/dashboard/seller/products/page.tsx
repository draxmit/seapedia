import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getOwnStore } from "@/server/services/seller-service";
import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteProductButton } from "./delete-button";

export const metadata: Metadata = { title: "Produk Saya" };
export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const store = await getOwnStore(auth.user.id);
  if (!store) {
    return (
      <EmptyState
        title="Kamu belum memiliki toko"
        description="Buat toko terlebih dahulu sebelum menambahkan produk."
        action={
          <Link
            href="/dashboard/seller/store"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Buat Toko
          </Link>
        }
      />
    );
  }

  const products = await prisma.product.findMany({
    where: { storeId: store.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
            Produk Saya
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} produk aktif di {store.name}
          </p>
        </div>
        <Link
          href="/dashboard/seller/products/new"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
        >
          + Tambah Produk
        </Link>
      </header>

      {products.length === 0 ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan produk pertamamu agar muncul di katalog publik."
          action={
            <Link
              href="/dashboard/seller/products/new"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              + Tambah Produk
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                  <th className="px-5 py-3">Produk</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Harga</th>
                  <th className="px-5 py-3">Stok</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                          {p.imageUrl && (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/products/${p.slug}`}
                            className="block max-w-64 truncate font-semibold text-ink-900 hover:text-brand-700"
                          >
                            {p.name}
                          </Link>
                          <span className="text-xs text-ink-400">
                            /{p.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{p.category ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-ink-900">
                      {formatIDR(p.price)}
                    </td>
                    <td className="px-5 py-3">
                      {p.stock === 0 ? (
                        <Badge tone="red">Habis</Badge>
                      ) : p.stock < 10 ? (
                        <Badge tone="amber">{p.stock} tersisa</Badge>
                      ) : (
                        <span className="text-ink-700">{p.stock}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/seller/products/${p.id}/edit`}
                          className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
                        >
                          Ubah
                        </Link>
                        <DeleteProductButton productId={p.id} productName={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
