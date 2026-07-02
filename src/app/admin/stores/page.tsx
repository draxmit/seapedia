import type { Metadata } from "next";
import Link from "next/link";
import { listStoresAdmin } from "@/server/services/admin-service";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin — Toko" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function AdminStoresPage() {
  const stores = await listStoresAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Toko ({stores.length})
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Seluruh toko yang terdaftar di marketplace.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-stone-50 text-xs font-bold tracking-wide text-ink-500 uppercase">
                <th className="px-5 py-3">Toko</th>
                <th className="px-5 py-3">Pemilik</th>
                <th className="px-5 py-3">Kota</th>
                <th className="px-5 py-3 text-right">Produk</th>
                <th className="px-5 py-3 text-right">Pesanan</th>
                <th className="px-5 py-3">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink-100 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3">
                    <Link
                      href={`/stores/${s.slug}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {s.owner.name}{" "}
                    <span className="text-xs text-ink-400">@{s.owner.username}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{s.city ?? "—"}</td>
                  <td className="px-5 py-3 text-right text-ink-700">{s._count.products}</td>
                  <td className="px-5 py-3 text-right text-ink-700">{s._count.orders}</td>
                  <td className="px-5 py-3 text-xs text-ink-400">
                    {dateFmt.format(s.createdAt)}
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
