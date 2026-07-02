import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { getJobDetail } from "@/server/services/driver-service";

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("DRIVER");
    const { id } = await ctx.params;
    const job = await getJobDetail(auth.user.id, id);
    return jsonOk(job);
  },
);
