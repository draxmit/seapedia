import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { addressSchema } from "@/server/validation";
import { deleteAddress, updateAddress } from "@/server/services/buyer-service";

export const PUT = handle(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("BUYER");
    const { id } = await ctx.params;
    const input = addressSchema.parse(await req.json());
    const address = await updateAddress(auth.user.id, id, input);
    return jsonOk(address);
  },
);

export const DELETE = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("BUYER");
    const { id } = await ctx.params;
    await deleteAddress(auth.user.id, id);
    return jsonOk({ deleted: true });
  },
);
