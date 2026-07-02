import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/openapi";

/** The OpenAPI 3.0 spec as JSON — consumed by the /api-docs viewer. */
export function GET() {
  return NextResponse.json(openApiDocument);
}
