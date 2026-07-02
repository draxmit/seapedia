"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const missing: Record<string, string> = {};
    if (!identifier.trim()) missing.identifier = "Username atau email wajib diisi";
    if (!password) missing.password = "Password wajib diisi";
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.fields && Object.keys(body.fields).length > 0) {
          setFieldErrors(body.fields);
        } else {
          setError(body.error ?? "Gagal masuk");
        }
        return;
      }
      const next = searchParams.get("next");
      if (body.data.needsRoleSelection) {
        router.push(`/pilih-peran${next ? `?next=${encodeURIComponent(next)}` : ""}`);
      } else if (body.data.activeRole === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(next ?? "/dashboard");
      }
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Username atau Email" htmlFor="identifier" error={fieldErrors.identifier}>
        <Input
          id="identifier"
          value={identifier}
          onChange={(e) => {
            setFieldErrors((x) => (x.identifier ? { ...x, identifier: "" } : x));
            setIdentifier(e.target.value);
          }}
          placeholder="cth: budi atau budi@mail.com"
          autoComplete="username"
          aria-invalid={Boolean(fieldErrors.identifier)}
          required
        />
      </Field>
      <Field label="Password" htmlFor="password" error={fieldErrors.password}>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setFieldErrors((x) => (x.password ? { ...x, password: "" } : x));
            setPassword(e.target.value);
          }}
          placeholder="••••••••"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password)}
          required
        />
      </Field>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}
