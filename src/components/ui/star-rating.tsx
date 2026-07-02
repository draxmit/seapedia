"use client";

import { cn } from "@/lib/cn";

function Star({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("h-4 w-4", filled || half ? "text-amber-400" : "text-ink-200")}
      fill="currentColor"
      aria-hidden
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

/** Read-only star display. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(rating)} />
      ))}
    </span>
  );
}

/** Interactive star picker for forms. */
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} bintang`}
          onClick={() => onChange(i)}
          className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <svg
            viewBox="0 0 20 20"
            className={cn("h-7 w-7", i <= value ? "text-amber-400" : "text-ink-200")}
            fill="currentColor"
          >
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
