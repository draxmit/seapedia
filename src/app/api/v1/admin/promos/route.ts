import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { promoSchema } from "@/server/validation";
import { createPromo, listAllPromos } from "@/server/services/discount-service";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  return jsonOk(await listAllPromos());
});

export const POST = handle(async (req: Request) => {
  await requireRole("ADMIN");
  const input = promoSchema.parse(await req.json());
  const promo = await createPromo(input);
  return jsonOk(promo, { status: 201 });
});
