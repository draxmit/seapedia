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
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal masuk");
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
    <form onSubmit={submit} className="space-y-5">
      <Field label="Username atau Email" htmlFor="identifier">
        <Input
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="cth: budi atau budi@mail.com"
          autoComplete="username"
          required
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
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
