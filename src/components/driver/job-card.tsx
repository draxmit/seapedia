import Link from "next/link";
import { formatIDR } from "@/lib/money";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { DeliveryMethod } from "@prisma/client";

export type JobCardData = {
  id: string;
  fee: number;
  order: {
    code: string;
    deliveryMethod: DeliveryMethod;
    fullAddress: string;
    recipient: string;
    store: { name: string; city: string | null };
    items: { productName: string; quantity: number }[];
  };
};

const methodTone: Record<DeliveryMethod, "red" | "amber" | "sky"> = {
  INSTANT: "red",
  NEXT_DAY: "amber",
  REGULAR: "sky",
};

export function JobCard({ job, highlight }: { job: JobCardData; highlight?: boolean }) {
  const itemCount = job.order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Link
      href={`/dashboard/driver/jobs/${job.id}`}
      className={
        highlight
          ? "block rounded-2xl bg-sky-50 p-5 ring-2 ring-sky-500 transition-shadow hover:shadow-lift"
          : "block rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5 transition-shadow hover:shadow-lift"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm font-bold text-ink-900">
            {job.order.code}
          </span>
          <Badge tone={methodTone[job.order.deliveryMethod]}>
            {DELIVERY_METHOD_LABELS[job.order.deliveryMethod]}
          </Badge>
          {highlight && <Badge tone="sky">Job Aktif</Badge>}
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400">Upah antar</p>
          <p className="text-base font-extrabold text-brand-700">
            {formatIDR(job.fee)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
            A
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-400">Ambil dari</p>
            <p className="truncate text-sm font-bold text-ink-900">
              {job.order.store.name}
            </p>
            <p className="text-xs text-ink-500">{job.order.store.city ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-700">
            B
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-400">Antar ke</p>
            <p className="truncate text-sm font-bold text-ink-900">
              {job.order.recipient}
            </p>
            <p className="line-clamp-1 text-xs text-ink-500">{job.order.fullAddress}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 border-t border-ink-100 pt-2.5 text-xs text-ink-500">
        {itemCount} barang · {job.order.items.map((i) => i.productName).join(", ")}
      </p>
    </Link>
  );
}
