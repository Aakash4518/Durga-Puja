import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const reviewSchema = z.object({
  reviewerName: z.string().trim().min(2).max(60),
  comment: z.string().trim().max(1000).default(""),
  ratings: z.record(z.string(), z.number().int().min(1).max(5)).refine(value => Object.keys(value).length > 0, "Please provide ratings."),
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid vendor ID." }, { status: 400 });
    const db = await getDb();
    const reviews = await db.collection("vendorReviews").find({ stallId: id, status: "published" }).sort({ createdAt: -1 }).limit(100).toArray();
    const sums: Record<string, { total: number; count: number }> = {};
    for (const review of reviews) {
      const ratings = review.ratings as Record<string, number>;
      for (const [key, value] of Object.entries(ratings || {})) {
        sums[key] ??= { total: 0, count: 0 };
        sums[key].total += Number(value); sums[key].count += 1;
      }
    }
    const averages = Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, Math.round((value.total / value.count) * 10) / 10]));
    return NextResponse.json({ data: reviews.map(review => ({ ...review, _id: String(review._id) })), count: reviews.length, averages });
  } catch { return NextResponse.json({ error: "Could not load reviews." }, { status: 503 }); }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid vendor ID." }, { status: 400 });
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please check your name and ratings.", details: parsed.error.flatten() }, { status: 400 });
    const db = await getDb();
    const vendor = await db.collection("stalls").findOne({ _id: new ObjectId(id), status: "published" }, { projection: { _id: 1, category: 1 } });
    if (!vendor) return NextResponse.json({ error: "Published vendor not found." }, { status: 404 });
    const doc = { stallId: id, reviewerName: parsed.data.reviewerName, comment: parsed.data.comment, ratings: parsed.data.ratings, status: "published", createdAt: new Date() };
    await db.collection("vendorReviews").insertOne(doc);
    return NextResponse.json({ ok: true, message: "Thank you for reviewing this vendor." }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not submit review. Please try again." }, { status: 503 }); }
}
