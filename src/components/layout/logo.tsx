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
      <rect width="32" height="32" rx="9" fill="url(#sea)" />
      <path
        d="M6 13.5c2.5-2.8 5-2.8 7.5 0s5 2.8 7.5 0 4-2.3 5 0"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M6 20c2.5-2.8 5-2.8 7.5 0s5 2.8 7.5 0 4-2.3 5 0"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
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
