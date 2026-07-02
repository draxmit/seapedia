import { cn } from "@/lib/cn";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

type Tone = "brand" | "ink" | "amber" | "sky" | "red" | "violet";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
  ink: "bg-ink-100 text-ink-700 ring-ink-600/10",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export function Badge({
  tone = "ink",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const statusTones: Record<OrderStatus, Tone> = {
  SEDANG_DIKEMAS: "amber",
  MENUNGGU_PENGIRIM: "violet",
  SEDANG_DIKIRIM: "sky",
  PESANAN_SELESAI: "brand",
  DIKEMBALIKAN: "red",
};

/** Order status pill using the mandated Indonesian labels. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={statusTones[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
