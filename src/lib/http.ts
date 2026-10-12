import { NextResponse } from "next/server";

export function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status });
}

export function parseLimit(value: string | null, fallback = 50, max = 100) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}
