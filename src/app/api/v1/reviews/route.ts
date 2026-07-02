import { handle, jsonOk } from "@/server/api";
import { getAuth } from "@/server/auth";
import { reviewSchema } from "@/server/validation";
import { createAppReview, listAppReviews } from "@/server/services/review-service";

export const GET = handle(async () => {
  const data = await listAppReviews();
  return jsonOk(data);
});

export const POST = handle(async (req: Request) => {
  const input = reviewSchema.parse(await req.json());
  // Reviews are open to guests; attach the user id when one is logged in
  const auth = await getAuth();
  const review = await createAppReview(input, auth?.user.id);
  return jsonOk(review, { status: 201 });
});
