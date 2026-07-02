import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getPromo } from "@/server/services/discount-service";

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    return jsonOk(await getPromo(id));
  },
);
