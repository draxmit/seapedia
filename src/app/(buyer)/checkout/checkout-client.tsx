"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { DeliveryMethod } from "@prisma/client";
import { DELIVERY_FEES, DELIVERY_METHOD_LABELS } from "@/lib/constants";
import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type AddressOpt = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  summary: string;
  isDefault: boolean;
};

type ItemRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

type Quote = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  discount: { kind: "VOUCHER" | "PROMO"; code: string; name: string } | null;
};

const methodDescriptions: Record<DeliveryMethod, string> = {
  INSTANT: "Tiba hari ini juga",
  NEXT_DAY: "Tiba besok",
  REGULAR: "Tiba dalam 3 hari",
};

export function CheckoutClient({
  walletBalance,
  addresses,
  items,
}: {
  walletBalance: number;
  addresses: AddressOpt[];
  items: ItemRow[];
}) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0].id,
  );
  const [method, setMethod] = useState<DeliveryMethod>("REGULAR");
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<
    { code: string; name: string; kind: "VOUCHER" | "PROMO" }[]
  >([]);

  const refreshQuote = useCallback(
    async (m: DeliveryMethod, code?: string) => {
      setCodeError(null);
      const res = await fetch("/api/v1/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: m, discountCode: code }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (code) {
          // Invalid code: keep the quote without it and surface the reason
          setCodeError(body.error ?? "Kode tidak valid");
          setAppliedCode(undefined);
          await refreshQuote(m, undefined);
        } else {
          setError(body.error ?? "Gagal menghitung ringkasan");
        }
        return;
      }
      setQuote(body.data);
      setAppliedCode(code);
    },
    [],
  );

  useEffect(() => {
    refreshQuote(method, appliedCode);
    fetch("/api/v1/discounts")
      .then((r) => r.json())
      .then((body) => {
        const v = (body.data?.vouchers ?? []).map(
          (x: { code: string; name: string }) => ({ ...x, kind: "VOUCHER" as const }),
        );
        const p = (body.data?.promos ?? []).map(
          (x: { code: string; name: string }) => ({ ...x, kind: "PROMO" as const }),
        );
        setAvailable([...v, ...p]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeMethod(m: DeliveryMethod) {
    setMethod(m);
    await refreshQuote(m, appliedCode);
  }

  async function applyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeInput.trim()) return;
    await refreshQuote(method, codeInput.trim().toUpperCase());
  }

  async function removeCode() {
    setCodeInput("");
    await refreshQuote(method, undefined);
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          deliveryMethod: method,
          discountCode: appliedCode,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Checkout gagal");
        return;
      }
      router.push(`/dashboard/orders/${body.data.id}?baru=1`);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  const insufficient = quote !== null && walletBalance < quote.total;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {/* Address */}
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <h2 className="font-bold text-ink-900">Alamat Pengiriman</h2>
          <div className="mt-3 space-y-2.5">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-colors",
                  addressId === a.id
                    ? "border-brand-600 bg-brand-50/50"
                    : "border-ink-200 hover:border-ink-300",
                )}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-1 h-4 w-4 accent-brand-600"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
                    {a.label}
                    {a.isDefault && <Badge tone="brand">Utama</Badge>}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-600">
                    {a.recipient} · {a.phone}
                  </span>
                  <span className="block text-sm text-ink-500">{a.summary}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Delivery method */}
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <h2 className="font-bold text-ink-900">Metode Pengiriman</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {(Object.keys(DELIVERY_FEES) as DeliveryMethod[]).map((m) => (
              <label
                key={m}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-3.5 transition-colors",
                  method === m
                    ? "border-brand-600 bg-brand-50/50"
                    : "border-ink-200 hover:border-ink-300",
                )}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={method === m}
                  onChange={() => changeMethod(m)}
                  className="sr-only"
                />
                <span className="block text-sm font-bold text-ink-900">
                  {DELIVERY_METHOD_LABELS[m]}
                </span>
                <span className="block text-xs text-ink-500">
                  {methodDescriptions[m]}
                </span>
                <span className="mt-1.5 block text-sm font-extrabold text-brand-700">
                  {formatIDR(DELIVERY_FEES[m])}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Discount code */}
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <h2 className="font-bold text-ink-900">Kode Voucher / Promo</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Satu kode per checkout — voucher dan promo tidak bisa digabung.
          </p>
          {quote?.discount ? (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-600/10">
              <div className="flex items-center gap-2">
                <Badge tone={quote.discount.kind === "VOUCHER" ? "brand" : "violet"}>
                  {quote.discount.kind === "VOUCHER" ? "Voucher" : "Promo"}
                </Badge>
                <span className="text-sm font-bold text-brand-900">
                  {quote.discount.code}
                </span>
                <span className="hidden text-xs text-brand-800/70 sm:inline">
                  {quote.discount.name}
                </span>
              </div>
              <button
                onClick={removeCode}
                className="cursor-pointer text-xs font-bold text-red-600 hover:underline"
              >
                Lepas
              </button>
            </div>
          ) : (
            <form onSubmit={applyCode} className="mt-3 flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="cth: HEMAT10"
                maxLength={30}
                className="uppercase"
              />
              <Button type="submit" variant="secondary">
                Pakai
              </Button>
            </form>
          )}
          {codeError && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {codeError}
            </p>
          )}
          {!quote?.discount && available.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-ink-500">Kode yang tersedia:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {available.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => refreshQuote(method, d.code)}
                    title={d.name}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-xs font-bold ring-1 transition-colors",
                      d.kind === "VOUCHER"
                        ? "bg-brand-50 text-brand-800 ring-brand-600/20 hover:bg-brand-100"
                        : "bg-violet-50 text-violet-800 ring-violet-600/20 hover:bg-violet-100",
                    )}
                  >
                    {d.code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Items */}
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <h2 className="font-bold text-ink-900">Barang Pesanan</h2>
          <ul className="mt-3 divide-y divide-ink-100">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  {i.imageUrl && (
                    <Image src={i.imageUrl} alt={i.name} fill sizes="48px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-semibold text-ink-800">
                    {i.name}
                  </span>
                  <span className="text-xs text-ink-500">
                    {i.quantity} × {formatIDR(i.price)}
                  </span>
                </span>
                <span className="text-sm font-bold text-ink-950">
                  {formatIDR(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Summary */}
      <aside>
        <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <h2 className="font-bold text-ink-900">Ringkasan Pembayaran</h2>
          {quote ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatIDR(quote.subtotal)} />
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  Diskon
                  {quote.discount && (
                    <Badge tone={quote.discount.kind === "VOUCHER" ? "brand" : "violet"}>
                      {quote.discount.kind === "VOUCHER" ? "Voucher" : "Promo"}
                    </Badge>
                  )}
                </dt>
                <dd
                  className={
                    quote.discountAmount > 0
                      ? "font-semibold text-brand-700"
                      : "text-ink-400"
                  }
                >
                  {quote.discountAmount > 0
                    ? `−${formatIDR(quote.discountAmount)}`
                    : formatIDR(0)}
                </dd>
              </div>
              <Row label="PPN 12%" value={formatIDR(quote.taxAmount)} />
              <Row
                label={`Ongkir (${DELIVERY_METHOD_LABELS[method]})`}
                value={formatIDR(quote.deliveryFee)}
              />
              <div className="flex items-center justify-between border-t border-ink-100 pt-2.5">
                <dt className="font-bold text-ink-950">Total Bayar</dt>
                <dd className="text-lg font-extrabold text-brand-700">
                  {formatIDR(quote.total)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ink-400">Menghitung…</p>
          )}

          <div
            className={cn(
              "mt-4 rounded-xl px-3.5 py-2.5 text-sm",
              insufficient
                ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                : "bg-stone-50 text-ink-600 ring-1 ring-ink-950/5",
            )}
          >
            Saldo dompet: <strong>{formatIDR(walletBalance)}</strong>
            {insufficient && " — saldo tidak cukup, silakan top up."}
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {insufficient ? (
            <Button
              className="mt-4 w-full"
              size="lg"
              variant="secondary"
              onClick={() => router.push("/dashboard/wallet")}
            >
              Top Up Dompet
            </Button>
          ) : (
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={pay}
              disabled={busy || !quote}
            >
              {busy ? "Memproses Pembayaran…" : "Bayar Sekarang"}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
