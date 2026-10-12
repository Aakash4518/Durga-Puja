import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse, parseLimit } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const db = await getDb();
    const data = await db.collection("announcements").find({ status: "published" }).sort({ publishedAt: -1 }).limit(parseLimit(searchParams.get("limit"))).toArray();
    return NextResponse.json({ data });
  } catch (error) { return errorResponse(error, 503); }
}
