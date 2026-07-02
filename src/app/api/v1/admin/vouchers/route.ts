import { handle, jsonOk } from "@/server/api";
import { requireRole } from "@/server/auth";
import { voucherSchema } from "@/server/validation";
import { createVoucher, listAllVouchers } from "@/server/services/discount-service";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  return jsonOk(await listAllVouchers());
});

export const POST = handle(async (req: Request) => {
  await requireRole("ADMIN");
  const input = voucherSchema.parse(await req.json());
  const voucher = await createVoucher(input);
  return jsonOk(voucher, { status: 201 });
});
