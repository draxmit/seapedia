import Link from "next/link";
import Image from "next/image";
import { formatIDR } from "@/lib/money";
import type { PublicProduct } from "@/server/services/product-service";

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-950/[0.06] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lift hover:ring-brand-600/15"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z"
              />
            </svg>
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-ink-950/80 px-2.5 py-1 text-[11px] font-bold text-white">
            Stok Habis
          </span>
        )}
        {product.category && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-snug font-medium text-ink-800 transition-colors group-hover:text-brand-700">
          {product.name}
        </h3>
        <p className="tnum mt-2 text-[17px] font-extrabold text-ink-950">
          {formatIDR(product.price)}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-brand-600" aria-hidden>
            <path
              fillRule="evenodd"
              d="M9.69 18.933l.003.001c.198.087.421.087.614 0l.004-.001.011-.005.038-.018a5.741 5.741 0 00.281-.145c.186-.1.4-.27.615-.454.433-.368.9-.902 1.318-1.545a11.72 11.72 0 001.671-3.577c.242-.89.365-1.856.365-2.939a5.61 5.61 0 00-11.22 0c0 1.083.123 2.048.365 2.939a11.72 11.72 0 001.67 3.577c.42.643.886 1.177 1.319 1.545.215.184.429.353.615.454a5.74 5.74 0 00.319.163l.011.005zM10 11.25a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">
            {product.store.name}
            {product.store.city ? ` · ${product.store.city}` : ""}
          </span>
        </p>
      </div>
    </Link>
  );
}
