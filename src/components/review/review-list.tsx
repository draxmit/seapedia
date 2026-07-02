import { Stars } from "@/components/ui/star-rating";
import { EmptyState } from "@/components/ui/empty-state";

/** Public-facing review shape (no internal userId). */
export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

function timeAgo(input: Date | string): string {
  // Cached reads deliver dates as ISO strings, so coerce before using them.
  const date = input instanceof Date ? input : new Date(input);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

/**
 * Reviews render as plain React text nodes — user content is always
 * escaped, so submitted markup shows up as harmless literal text.
 */
export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Belum ada ulasan"
        description="Jadilah yang pertama membagikan pengalamanmu menggunakan SEAPEDIA."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <figure
          key={review.id}
          className="flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5"
        >
          <Stars rating={review.rating} />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed break-words text-ink-700">
            “{review.comment}”
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-2.5 border-t border-ink-100 pt-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
              {review.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold break-words text-ink-900">
                {review.name}
              </p>
              <p className="text-xs text-ink-400">{timeAgo(review.createdAt)}</p>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
