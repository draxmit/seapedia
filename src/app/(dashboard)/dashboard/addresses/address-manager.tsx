"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export type AddressDto = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

type FormState = Omit<AddressDto, "id" | "isDefault"> & { isDefault: boolean };

const emptyForm: FormState = {
  label: "",
  recipient: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
  isDefault: false,
};

export function AddressManager({ addresses }: { addresses: AddressDto[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startNew() {
    setForm(emptyForm);
    setEditing("new");
    setError(null);
  }

  function startEdit(a: AddressDto) {
    setForm({ ...a });
    setEditing(a.id);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const isNew = editing === "new";
      const res = await fetch(
        isNew ? "/api/v1/addresses" : `/api/v1/addresses/${editing}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal menyimpan alamat");
        return;
      }
      setEditing(null);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/addresses/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {editing === null && (
        <Button onClick={startNew}>+ Tambah Alamat</Button>
      )}

      {editing !== null && (
        <form
          onSubmit={save}
          className="space-y-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5"
        >
          <h3 className="font-bold text-ink-900">
            {editing === "new" ? "Alamat Baru" : "Ubah Alamat"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" htmlFor="a-label" hint="cth: Rumah, Kantor, Kos">
              <Input id="a-label" value={form.label} maxLength={30} required
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </Field>
            <Field label="Nama Penerima" htmlFor="a-recipient">
              <Input id="a-recipient" value={form.recipient} maxLength={60} required
                onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))} />
            </Field>
            <Field label="No. HP Penerima" htmlFor="a-phone">
              <Input id="a-phone" type="tel" value={form.phone} required placeholder="081234567890"
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="Kode Pos" htmlFor="a-postal">
              <Input id="a-postal" value={form.postalCode} required placeholder="12345" maxLength={5}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
            </Field>
          </div>
          <Field label="Alamat Lengkap" htmlFor="a-street">
            <Input id="a-street" value={form.street} maxLength={160} required
              placeholder="Nama jalan, nomor rumah, RT/RW"
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kota/Kabupaten" htmlFor="a-city">
              <Input id="a-city" value={form.city} maxLength={40} required
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </Field>
            <Field label="Provinsi" htmlFor="a-province">
              <Input id="a-province" value={form.province} maxLength={40} required
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded accent-brand-600"
            />
            Jadikan alamat utama
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan Alamat"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Batal
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && editing === null ? (
        <EmptyState
          title="Belum ada alamat"
          description="Tambahkan alamat pengiriman agar bisa melakukan checkout."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-bold text-ink-900">
                  {a.label}
                  {a.isDefault && <Badge tone="brand">Utama</Badge>}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(a)}
                    className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50"
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    disabled={busy}
                    className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink-800">
                {a.recipient} · {a.phone}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                {a.street}, {a.city}, {a.province} {a.postalCode}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
