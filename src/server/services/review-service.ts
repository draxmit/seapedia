import "server-only";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/server/sanitize";
import type { z } from "zod";
import type { reviewSchema } from "@/server/validation";

/**
 * Public application reviews (testimoni) about the SEAPEDIA experience.
 * Open to guests — no transaction required. Comments are stored as plain
 * text and always rendered escaped (never as HTML) on the client.
 */
export async function listAppReviews(limit = 50) {
  const [reviews, aggregate] = await Promise.all([
    prisma.appReview.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      // Public payload: never expose the internal reviewer userId
      select: {
        id: true,
        name: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    }),
    prisma.appReview.aggregate({
      _avg: { rating: true },
      _count: true,
    }),
  ]);
  return {
    reviews,
    averageRating: aggregate._avg.rating ?? 0,
    totalReviews: aggregate._count,
  };
}

export async function createAppReview(
  input: z.infer<typeof reviewSchema>,
  userId?: string,
) {
  return prisma.appReview.create({
    data: {
      name: sanitizeText(input.name),
      rating: input.rating,
      comment: sanitizeText(input.comment),
      userId: userId ?? null,
    },
  });
}
