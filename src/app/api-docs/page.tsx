import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { SwaggerViewer } from "./swagger";

export const metadata: Metadata = {
  title: "Dokumentasi API",
  description: "Referensi REST API SEAPEDIA (OpenAPI / Swagger UI).",
};

/** Standalone API reference page rendering Swagger UI over our OpenAPI spec. */
export default function ApiDocsPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4 text-sm">
          <a
            href="/api/openapi.json"
            className="font-semibold text-ink-500 hover:text-brand-700"
          >
            openapi.json
          </a>
          <Link href="/" className="font-semibold text-brand-700 hover:text-brand-800">
            ← Beranda
          </Link>
        </div>
      </header>
      <SwaggerViewer />
    </div>
  );
}
