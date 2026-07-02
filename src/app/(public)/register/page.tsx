import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col px-4 py-16">
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-ink-950">
        Buat akun SEAPEDIA
      </h1>
      <p className="mt-2 text-center text-sm text-ink-500">
        Satu akun bisa memiliki lebih dari satu peran — pilih sesuai kebutuhanmu.
      </p>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink-950/5 sm:p-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-ink-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Masuk
        </Link>
      </p>
    </div>
  );
}
