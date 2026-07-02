import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-ink-950">
        Selamat datang kembali
      </h1>
      <p className="mt-2 text-center text-sm text-ink-500">
        Masuk untuk melanjutkan sebagai Pembeli, Penjual, Driver, atau Admin.
      </p>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink-950/5 sm:p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-ink-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
