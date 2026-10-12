import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse, parseLimit } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year"));
    const filter: Record<string, unknown> = { published: true };
    if (Number.isInteger(year) && year >= 2000 && year <= 2100) filter.year = year;
    const db = await getDb();
    const data = await db.collection("media").find(filter).sort({ year: -1, createdAt: -1 }).limit(parseLimit(searchParams.get("limit"))).toArray();
    return NextResponse.json({ data });
  } catch (error) { return errorResponse(error, 503); }
}
