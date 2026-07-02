"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { StarPicker } from "@/components/ui/star-rating";

/**
 * Public application review form — usable by guests and logged-in users
 * alike, no transaction needed. Server re-validates everything.
 */
export function ReviewForm({ defaultName }: { defaultName?: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName ?? "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Silakan pilih rating terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal mengirim ulasan");
        return;
      }
      setDone(true);
      setName(defaultName ?? "");
      setRating(0);
      setComment("");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-brand-50 px-6 py-10 text-center ring-1 ring-brand-600/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <h3 className="mt-3 font-bold text-brand-900">Terima kasih atas ulasanmu!</h3>
        <p className="mt-1 text-sm text-brand-800/70">
          Masukanmu membantu SEAPEDIA menjadi lebih baik.
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setDone(false)}>
          Tulis ulasan lagi
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nama" htmlFor="review-name">
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kamu"
          maxLength={60}
          required
        />
      </Field>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-700">
          Rating pengalamanmu
        </span>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <Field label="Komentar" htmlFor="review-comment">
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalamanmu menggunakan SEAPEDIA…"
          maxLength={500}
          required
        />
      </Field>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Mengirim…" : "Kirim Ulasan"}
      </Button>
    </form>
  );
}
