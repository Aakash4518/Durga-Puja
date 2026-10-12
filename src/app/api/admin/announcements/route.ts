import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { announcementSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const data = await db.collection("announcements").find({}).sort({ createdAt: -1 }).limit(200).toArray();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const parsed = announcementSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
    const db = await getDb();
    const now = new Date();
    const doc = { ...parsed.data, createdAt: now, updatedAt: now, createdBy: session.email };
    const result = await db.collection("announcements").insertOne(doc);
    return NextResponse.json({ ok: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json() as { id?: string; [key: string]: unknown };
    if (!body.id || !ObjectId.isValid(body.id)) return NextResponse.json({ error: "A valid id is required." }, { status: 400 });
    const { id, ...input } = body;
    const parsed = announcementSchema.partial().safeParse(input);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
    const db = await getDb();
    const result = await db.collection("announcements").updateOne({ _id: new ObjectId(id) }, { $set: { ...parsed.data, updatedAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 503 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "A valid id is required." }, { status: 400 });
    const db = await getDb();
    const collection = db.collection("announcements");
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    if (existing.status === "published") return NextResponse.json({ error: "Unpublish this item first. Only pending/draft items can be permanently deleted." }, { status: 409 });
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 503 });
  }
}
