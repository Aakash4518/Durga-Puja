import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse, parseLimit } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const filter: Record<string, unknown> = { status: "published" };
    if (category) filter.category = category;
    if (q) filter.$or = [
      { name: { $regex: q.slice(0, 80), $options: "i" } },
      { category: { $regex: q.slice(0, 80), $options: "i" } },
      { stallNumber: { $regex: q.slice(0, 80), $options: "i" } },
    ];
    const db = await getDb();
    const stalls = await db.collection("stalls").find(filter).sort({ name: 1 }).limit(parseLimit(searchParams.get("limit"))).toArray();
    const ids = stalls.map(stall => String(stall._id));
    const reviews = ids.length ? await db.collection("vendorReviews").find({ stallId: { $in: ids }, status: "published" }, { projection: { stallId: 1, ratings: 1 } }).toArray() : [];
    const ratingTotals = new Map<string, { sum: number; count: number }>();
    for (const review of reviews) {
      const values = Object.values((review.ratings || {}) as Record<string, unknown>).map(Number).filter(value => Number.isFinite(value) && value >= 1 && value <= 5);
      if (!values.length) continue;
      const overall = values.reduce((sum, value) => sum + value, 0) / values.length;
      const stallId = String(review.stallId);
      const total = ratingTotals.get(stallId) || { sum: 0, count: 0 };
      total.sum += overall;
      total.count += 1;
      ratingTotals.set(stallId, total);
    }
    const data = stalls.map(stall => {
      const total = ratingTotals.get(String(stall._id));
      return { ...stall, _id: String(stall._id), rating: total ? Math.round((total.sum / total.count) * 10) / 10 : null, reviewCount: total?.count || 0 };
    });
    return NextResponse.json({ data });
  } catch (error) { return errorResponse(error, 503); }
}
