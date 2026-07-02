import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="seaBg" x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="0.55" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <radialGradient id="seaHi" cx="0.28" cy="0.1" r="0.9">
          <stop stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#seaBg)" />
      <rect width="32" height="32" rx="9" fill="url(#seaHi)" />
      <path
        d="M6.4 11.6 q3.2 -2.6 6.4 0 t6.4 0 t6.4 0"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.4 18.6 q3.2 -3 6.4 0 t6.4 0 t6.4 0"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect
        x="0.6"
        y="0.6"
        width="30.8"
        height="30.8"
        rx="8.4"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 font-bold text-ink-950", className)}
    >
      <LogoMark />
      <span className="text-lg tracking-tight">
        SEA<span className="text-brand-600">PEDIA</span>
      </span>
    </Link>
  );
}
