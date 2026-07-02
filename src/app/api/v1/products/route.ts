import { handle, jsonOk } from "@/server/api";
import { listPublicProducts } from "@/server/services/product-service";

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const data = await listPublicProducts({
    search: url.searchParams.get("search") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    storeSlug: url.searchParams.get("store") ?? undefined,
    page: Number(url.searchParams.get("page")) || undefined,
    perPage: Number(url.searchParams.get("perPage")) || undefined,
  });
  return jsonOk(data);
});
