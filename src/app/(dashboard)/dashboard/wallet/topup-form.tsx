"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/money";
import { cn } from "@/lib/cn";

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000, 5_000_000];

export function TopUpForm() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount === "") return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal melakukan top up");
        return;
      }
      setSuccess(`Top up ${formatIDR(Number(amount))} berhasil!`);
      setAmount("");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(v)}
            className={cn(
              "cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
              amount === v
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-300",
            )}
          >
            {formatIDR(v)}
          </button>
        ))}
      </div>
      <Field label="Atau nominal lain" htmlFor="topup-amount" hint="Minimal Rp10.000">
        <Input
          id="topup-amount"
          type="number"
          min={10000}
          step={1000}
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="cth: 150000"
        />
      </Field>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
          ✓ {success}
        </p>
      )}
      <Button type="submit" disabled={busy || amount === ""} className="w-full">
        {busy ? "Memproses…" : "Top Up Sekarang"}
      </Button>
    </form>
  );
}
