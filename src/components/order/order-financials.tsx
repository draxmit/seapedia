import { formatIDR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

/**
 * The mandated checkout breakdown: subtotal, discount, delivery fee,
 * PPN 12%, and final total — always shown together.
 */
export function OrderFinancials({
  subtotal,
  discountAmount,
  discountCode,
  discountKind,
  taxAmount,
  deliveryFee,
  total,
}: {
  subtotal: number;
  discountAmount: number;
  discountCode?: string | null;
  discountKind?: "VOUCHER" | "PROMO" | null;
  taxAmount: number;
  deliveryFee: number;
  total: number;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-ink-500">Subtotal</dt>
        <dd className="font-semibold text-ink-900">{formatIDR(subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="flex items-center gap-1.5 text-ink-500">
          Diskon
          {discountKind && (
            <Badge tone={discountKind === "VOUCHER" ? "brand" : "violet"}>
              {discountKind === "VOUCHER" ? "Voucher" : "Promo"}
              {discountCode ? ` · ${discountCode}` : ""}
            </Badge>
          )}
        </dt>
        <dd className={discountAmount > 0 ? "font-semibold text-brand-700" : "text-ink-400"}>
          {discountAmount > 0 ? `−${formatIDR(discountAmount)}` : formatIDR(0)}
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-ink-500">PPN 12%</dt>
        <dd className="font-semibold text-ink-900">{formatIDR(taxAmount)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-ink-500">Ongkos Kirim</dt>
        <dd className="font-semibold text-ink-900">{formatIDR(deliveryFee)}</dd>
      </div>
      <div className="flex items-center justify-between border-t border-ink-100 pt-2.5">
        <dt className="font-bold text-ink-950">Total Bayar</dt>
        <dd className="text-lg font-extrabold tracking-tight text-brand-700">
          {formatIDR(total)}
        </dd>
      </div>
    </dl>
  );
}
