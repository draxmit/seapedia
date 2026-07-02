import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { takeJob } from "@/server/services/driver-service";

/** Claim an available job — race-safe, one active driver per order. */
export const POST = handle(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await requireRole("DRIVER");
    const { id } = await ctx.params;
    const job = await takeJob(auth.user.id, id);
    return jsonOk(job);
  },
);
