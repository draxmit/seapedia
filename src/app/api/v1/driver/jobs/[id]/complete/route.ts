import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { completeJob } from "@/server/services/driver-service";

/** Confirm delivery: job completed, order becomes Pesanan Selesai. */
export const POST = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("DRIVER");
    const { id } = await ctx.params;
    const job = await completeJob(auth.user.id, id);
    return jsonOk(job);
  },
);
