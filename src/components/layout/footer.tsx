import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const columns = [
  {
    title: "Jelajah",
    links: [
      { label: "Semua Produk", href: "/products" },
      { label: "Ulasan Pengguna", href: "/#ulasan" },
      { label: "Cara Kerja", href: "/#cara-kerja" },
    ],
  },
  {
    title: "Bergabung",
    links: [
      { label: "Daftar sebagai Pembeli", href: "/register" },
      { label: "Buka Toko (Penjual)", href: "/register" },
      { label: "Jadi Driver", href: "/register" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Masuk", href: "/login" },
      { label: "Dokumentasi API", href: "/api-docs" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
            Marketplace yang mempertemukan penjual, pembeli, dan driver dalam
            satu ekosistem belanja online yang aman dan nyaman.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold text-ink-900">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-500 transition-colors hover:text-brand-700"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-100 py-5 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} SEAPEDIA. Dibuat untuk Software Engineering
        Academy COMPFEST 18.
      </div>
    </footer>
  );
}
