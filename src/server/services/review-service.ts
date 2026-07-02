import "server-only";
import { prisma } from "@/lib/prisma";
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
      name: input.name,
      rating: input.rating,
      comment: input.comment,
      userId: userId ?? null,
    },
  });
}
