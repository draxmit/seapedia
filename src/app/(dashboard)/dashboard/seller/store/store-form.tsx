"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

type StoreInput = { name: string; description: string; city: string };

export function StoreForm({ initial }: { initial: StoreInput | null }) {
  const router = useRouter();
  const isEdit = initial !== null;
  const [form, setForm] = useState<StoreInput>(
    initial ?? { name: "", description: "", city: "" },
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/v1/seller/store", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal menyimpan toko");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <Field
        label="Nama Toko"
        htmlFor="store-name"
        hint="Harus unik di seluruh SEAPEDIA"
      >
        <Input
          id="store-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="cth: Toko Berkah Jaya"
          maxLength={40}
          required
        />
      </Field>
      <Field label="Kota (opsional)" htmlFor="store-city">
        <Input
          id="store-city"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          placeholder="cth: Jakarta Selatan"
          maxLength={40}
        />
      </Field>
      <Field label="Deskripsi (opsional)" htmlFor="store-desc">
        <Textarea
          id="store-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Ceritakan tokomu ke calon pembeli…"
          maxLength={300}
        />
      </Field>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
          ✓ Toko berhasil disimpan
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Toko"}
      </Button>
    </form>
  );
}
