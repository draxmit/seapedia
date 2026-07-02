import Link from "next/link";
import { getAuth } from "@/server/auth";
import { listPublicProducts } from "@/server/services/product-service";
import { listAppReviews } from "@/server/services/review-service";
import { ProductCard } from "@/components/product/product-card";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewList } from "@/components/review/review-list";
import { Stars } from "@/components/ui/star-rating";

// Rendered per request (fast: catalog & review reads are served from the
// cache-tagged data cache, so there is no per-request database round trip).
export const dynamic = "force-dynamic";

const roleHighlights = [
  {
    title: "Untuk Pembeli",
    description:
      "Isi saldo dompet, belanja dari berbagai toko, dan lacak pesananmu dari dikemas sampai tiba di rumah.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
        />
      </svg>
    ),
  },
  {
    title: "Untuk Penjual",
    description:
      "Buka toko dengan nama unikmu, kelola produk dan stok, proses pesanan, dan pantau pendapatan toko.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
        />
      </svg>
    ),
  },
  {
    title: "Untuk Driver",
    description:
      "Temukan job pengiriman yang siap diantar, ambil job, selesaikan, dan kumpulkan penghasilanmu.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
  },
];

const steps = [
  {
    step: "01",
    title: "Buat akun",
    description: "Daftar gratis dan pilih peranmu — boleh lebih dari satu.",
  },
  {
    step: "02",
    title: "Pilih peran aktif",
    description: "Satu akun bisa jadi Pembeli, Penjual, sekaligus Driver.",
  },
  {
    step: "03",
    title: "Mulai bertransaksi",
    description: "Belanja dengan dompet digital, kelola toko, atau ambil job antar.",
  },
  {
    step: "04",
    title: "Lacak semuanya",
    description: "Status pesanan transparan, dari Sedang Dikemas sampai Selesai.",
  },
];

export default async function LandingPage() {
  const [auth, { products }, reviewData] = await Promise.all([
    getAuth(),
    listPublicProducts({ perPage: 8 }),
    listAppReviews(6),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-stone-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(40rem 20rem at 80% -10%, rgb(16 185 129 / 0.15), transparent), radial-gradient(30rem 16rem at 10% 110%, rgb(4 120 87 / 0.1), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              Marketplace multi-peran pertama untukmu
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-ink-950 sm:text-5xl">
              Belanja, berjualan, dan{" "}
              <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                mengantar
              </span>{" "}
              — semua dalam satu akun.
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-500">
              SEAPEDIA mempertemukan pembeli, penjual, dan driver dalam satu
              ekosistem. Jelajahi produk tanpa akun, atau daftar dan pilih peranmu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-base font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
              >
                Jelajahi Produk
              </Link>
              {!auth && (
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-ink-200 bg-white px-6 text-base font-semibold text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  Daftar Gratis
                </Link>
              )}
            </div>
            <dl className="mt-10 flex gap-8">
              <div>
                <dt className="text-xs font-medium text-ink-400">Peran dalam 1 akun</dt>
                <dd className="text-2xl font-extrabold text-ink-950">3</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-400">Metode pengiriman</dt>
                <dd className="text-2xl font-extrabold text-ink-950">3</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-400">Rating aplikasi</dt>
                <dd className="flex items-center gap-1.5 text-2xl font-extrabold text-ink-950">
                  {reviewData.totalReviews > 0
                    ? reviewData.averageRating.toFixed(1)
                    : "–"}
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-400">
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                </dd>
              </div>
            </dl>
          </div>

          {/* Role cards */}
          <div id="cara-kerja" className="grid gap-4">
            {roleHighlights.map((role) => (
              <div
                key={role.title}
                className="flex items-start gap-4 rounded-2xl bg-white/80 p-5 shadow-card ring-1 ring-ink-950/5 backdrop-blur-sm transition-shadow hover:shadow-lift"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/10">
                  {role.icon}
                </span>
                <div>
                  <h3 className="font-bold text-ink-900">{role.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">
              Produk Terbaru
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Dari berbagai toko pilihan di SEAPEDIA
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Lihat semua →
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-10 text-center text-sm text-ink-500">
            Katalog sedang disiapkan. Jalankan seed data untuk mengisi produk demo.
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-950">
            Cara Kerja SEAPEDIA
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-500">
            Empat langkah sederhana untuk memulai — apa pun peranmu.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.step} className="relative rounded-2xl bg-stone-50 p-6 ring-1 ring-ink-950/5">
                <span className="text-3xl font-extrabold text-brand-200">{s.step}</span>
                <h3 className="mt-3 font-bold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  {s.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Reviews */}
      <section id="ulasan" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">
              Kata Mereka tentang SEAPEDIA
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
              {reviewData.totalReviews > 0 ? (
                <>
                  <Stars rating={reviewData.averageRating} />
                  <span className="font-semibold text-ink-800">
                    {reviewData.averageRating.toFixed(1)}
                  </span>
                  <span>dari {reviewData.totalReviews} ulasan pengguna</span>
                </>
              ) : (
                <span>Ulasan tentang pengalaman menggunakan aplikasi ini</span>
              )}
            </div>
            <div className="mt-6">
              <ReviewList reviews={reviewData.reviews} />
            </div>
          </div>
          <aside>
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-950/5">
              <h3 className="font-bold text-ink-900">Bagikan Pengalamanmu</h3>
              <p className="mt-1 mb-5 text-sm text-ink-500">
                Tidak perlu belanja dulu — semua pengunjung boleh menilai
                pengalaman menggunakan SEAPEDIA.
              </p>
              <ReviewForm defaultName={auth?.user.name} />
            </div>
          </aside>
        </div>
      </section>

      {/* CTA */}
      {!auth && (
        <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(30rem 14rem at 20% 0%, rgb(255 255 255 / 0.25), transparent)",
              }}
            />
            <h2 className="relative text-3xl font-extrabold tracking-tight text-white">
              Siap memulai perjalananmu?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-brand-100">
              Satu akun untuk belanja, membuka toko, dan mengantar pesanan.
            </p>
            <Link
              href="/register"
              className="relative mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-base font-bold text-brand-800 shadow-lift transition-transform hover:scale-[1.02]"
            >
              Daftar Sekarang — Gratis
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
