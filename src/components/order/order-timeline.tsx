import type { OrderStatus, OrderStatusHistory } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dotTone: Record<OrderStatus, string> = {
  SEDANG_DIKEMAS: "bg-amber-500",
  MENUNGGU_PENGIRIM: "bg-violet-500",
  SEDANG_DIKIRIM: "bg-sky-500",
  PESANAN_SELESAI: "bg-brand-600",
  DIKEMBALIKAN: "bg-red-500",
};

const actorLabels: Record<string, string> = {
  system: "Sistem",
  seller: "Penjual",
  driver: "Driver",
  buyer: "Pembeli",
  admin: "Admin",
};

/** Vertical status history with timestamps — newest at the bottom. */
export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  return (
    <ol className="space-y-0">
      {history.map((entry, idx) => {
        const isLast = idx === history.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!isLast && (
              <span
                className="absolute top-5 left-[7px] h-full w-0.5 bg-ink-200"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white",
                dotTone[entry.status],
              )}
            />
            <div className="min-w-0">
              <p className={cn("text-sm font-bold", isLast ? "text-ink-950" : "text-ink-700")}>
                {ORDER_STATUS_LABELS[entry.status]}
              </p>
              {entry.note && (
                <p className="mt-0.5 text-sm text-ink-500">{entry.note}</p>
              )}
              <p className="mt-0.5 text-xs text-ink-400">
                {dateFmt.format(entry.createdAt)}
                {entry.actor ? ` · oleh ${actorLabels[entry.actor] ?? entry.actor}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
