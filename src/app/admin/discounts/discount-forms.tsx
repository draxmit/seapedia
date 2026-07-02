"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Kind = "voucher" | "promo";

const empty = {
  code: "",
  name: "",
  valueType: "PERCENT",
  value: "",
  maxDiscount: "",
  minSubtotal: "",
  expiresAt: "",
  maxUsage: "",
};

export function DiscountForms() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("voucher");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof empty, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Record<string, unknown> = {
        code: form.code,
        name: form.name,
        valueType: form.valueType,
        value: Number(form.value),
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : 0,
        expiresAt: form.expiresAt,
      };
      if (form.maxDiscount) payload.maxDiscount = Number(form.maxDiscount);
      if (kind === "voucher") payload.maxUsage = Number(form.maxUsage);

      const res = await fetch(`/api/v1/admin/${kind === "voucher" ? "vouchers" : "promos"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal membuat kode");
        return;
      }
      setSuccess(`${kind === "voucher" ? "Voucher" : "Promo"} ${body.data.code} berhasil dibuat`);
      setForm(empty);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <Button onClick={() => { setKind("voucher"); setOpen(true); }}>
          + Buat Voucher
        </Button>
        <Button variant="secondary" onClick={() => { setKind("promo"); setOpen(true); }}>
          + Buat Promo
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
          {(["voucher", "promo"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold capitalize transition-colors",
                kind === k ? "bg-white text-ink-950 shadow-card" : "text-ink-500",
              )}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer text-sm font-semibold text-ink-400 hover:text-ink-700"
        >
          Tutup ✕
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Kode" htmlFor="d-code" hint="Huruf & angka, otomatis kapital">
          <Input id="d-code" value={form.code} required maxLength={30}
            placeholder="cth: HEMAT20"
            onChange={(e) => set("code", e.target.value.toUpperCase())} />
        </Field>
        <Field label="Nama" htmlFor="d-name">
          <Input id="d-name" value={form.name} required maxLength={80}
            placeholder="cth: Diskon Akhir Pekan"
            onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Tipe Potongan" htmlFor="d-type">
          <Select id="d-type" value={form.valueType}
            onChange={(e) => set("valueType", e.target.value)}>
            <option value="PERCENT">Persen (%)</option>
            <option value="FIXED">Nominal Tetap (Rp)</option>
          </Select>
        </Field>
        <Field
          label={form.valueType === "PERCENT" ? "Persentase (1-100)" : "Nominal (Rp)"}
          htmlFor="d-value"
        >
          <Input id="d-value" type="number" min={1} value={form.value} required
            placeholder={form.valueType === "PERCENT" ? "cth: 10" : "cth: 25000"}
            onChange={(e) => set("value", e.target.value)} />
        </Field>
        {form.valueType === "PERCENT" && (
          <Field label="Maks. Potongan (Rp, opsional)" htmlFor="d-max">
            <Input id="d-max" type="number" min={1000} value={form.maxDiscount}
              placeholder="cth: 50000"
              onChange={(e) => set("maxDiscount", e.target.value)} />
          </Field>
        )}
        <Field label="Min. Belanja (Rp, opsional)" htmlFor="d-min">
          <Input id="d-min" type="number" min={0} value={form.minSubtotal}
            placeholder="cth: 100000"
            onChange={(e) => set("minSubtotal", e.target.value)} />
        </Field>
        <Field label="Berlaku Sampai" htmlFor="d-exp">
          <Input id="d-exp" type="date" value={form.expiresAt} required
            onChange={(e) => set("expiresAt", e.target.value)} />
        </Field>
        {kind === "voucher" && (
          <Field label="Kuota Penggunaan" htmlFor="d-usage">
            <Input id="d-usage" type="number" min={1} value={form.maxUsage} required
              placeholder="cth: 100"
              onChange={(e) => set("maxUsage", e.target.value)} />
          </Field>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
          ✓ {success}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Menyimpan…" : `Buat ${kind === "voucher" ? "Voucher" : "Promo"}`}
      </Button>
    </form>
  );
}
