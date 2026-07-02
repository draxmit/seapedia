"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const roleOptions = [
  {
    value: "BUYER",
    title: "Pembeli",
    description: "Belanja produk dengan dompet digital dan lacak pesananmu.",
  },
  {
    value: "SELLER",
    title: "Penjual",
    description: "Buka toko, kelola produk, dan proses pesanan masuk.",
  },
  {
    value: "DRIVER",
    title: "Driver",
    description: "Ambil job pengiriman dan kumpulkan penghasilan.",
  },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [roles, setRoles] = useState<string[]>(["BUYER"]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function toggleRole(role: string) {
    setFieldErrors((e) => ({ ...e, roles: "" }));
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    // Clear a field's error as soon as the user edits it
    setFieldErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side required checks give instant, styled feedback (no native popup)
    const missing: Record<string, string> = {};
    if (!form.name.trim()) missing.name = "Nama wajib diisi";
    if (!form.username.trim()) missing.username = "Username wajib diisi";
    if (!form.email.trim()) missing.email = "Email wajib diisi";
    if (!form.password) missing.password = "Password wajib diisi";
    if (roles.length === 0) missing.roles = "Pilih minimal satu peran";
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roles }),
      });
      const body = await res.json();
      if (!res.ok) {
        // Prefer per-field messages; fall back to a general error otherwise
        if (body.fields && Object.keys(body.fields).length > 0) {
          setFieldErrors(body.fields);
        } else {
          setError(body.error ?? "Gagal mendaftar");
        }
        return;
      }
      router.push(body.data.needsRoleSelection ? "/pilih-peran" : "/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama Lengkap" htmlFor="name" error={fieldErrors.name}>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="cth: Budi Santoso"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
        </Field>
        <Field
          label="Username"
          htmlFor="username"
          hint="Huruf, angka, dan underscore"
          error={fieldErrors.username}
        >
          <Input
            id="username"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="cth: budisantoso"
            autoComplete="username"
            aria-invalid={Boolean(fieldErrors.username)}
            required
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="cth: budi@mail.com"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
        </Field>
        <Field label="No. HP (opsional)" htmlFor="phone" error={fieldErrors.phone}>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="cth: 081234567890"
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.phone)}
          />
        </Field>
      </div>
      <Field
        label="Password"
        htmlFor="password"
        hint="Minimal 8 karakter"
        error={fieldErrors.password}
      >
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password)}
          required
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">
          Daftar sebagai <span className="text-ink-400">(boleh lebih dari satu)</span>
        </legend>
        {fieldErrors.roles && (
          <p className="mb-2 text-xs font-medium text-red-600">{fieldErrors.roles}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {roleOptions.map((role) => {
            const checked = roles.includes(role.value);
            return (
              <label
                key={role.value}
                className={cn(
                  "cursor-pointer rounded-2xl border-2 p-3.5 transition-all",
                  checked
                    ? "border-brand-600 bg-brand-50/60"
                    : "border-ink-200 bg-white hover:border-ink-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRole(role.value)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between">
                  <span className={cn("text-sm font-bold", checked ? "text-brand-800" : "text-ink-800")}>
                    {role.title}
                  </span>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      checked ? "border-brand-600 bg-brand-600" : "border-ink-300 bg-white",
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="h-3 w-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-500">
                  {role.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? "Mendaftarkan…" : "Daftar"}
      </Button>
    </form>
  );
}
