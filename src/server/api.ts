import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Error with an HTTP status, thrown from services and caught by `handle`. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Wraps a route handler with uniform error handling:
 * - ApiError -> its own status + message
 * - ZodError -> 400 with readable field errors
 * - anything else -> 500 without leaking internals
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return jsonError(err.status, err.message);
      }
      if (err instanceof ZodError) {
        // Per-field messages so the client can show each error inline next to
        // its input; keep a combined summary string for backward compatibility.
        const fields: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.length ? String(issue.path[0]) : "_";
          if (!fields[key]) fields[key] = issue.message;
        }
        const details = err.issues
          .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
          .join("; ");
        return NextResponse.json(
          { success: false, error: `Data tidak valid — ${details}`, fields },
          { status: 400 },
        );
      }
      console.error("Unhandled API error:", err);
      return jsonError(500, "Terjadi kesalahan pada server");
    }
  };
}
