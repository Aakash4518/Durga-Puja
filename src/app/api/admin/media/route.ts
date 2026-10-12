import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, requireContributor } from "@/lib/auth";
import { mediaSchema } from "@/lib/validators";
import { getCloudinary } from "@/lib/media/providers";

export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const records = await db.collection("media").find({}).sort({ createdAt: -1 }).limit(200).toArray();
    const data = records.map((record) => ({ ...record, _id: record._id.toString() }));
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let session: { email: string; role: "admin" | "contributor" };
    try { session = await requireAdmin(); } catch { session = await requireContributor(); }
    const parsed = mediaSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
    const db = await getDb();
    const now = new Date();
    const doc = { ...parsed.data, published: session.role === "admin" ? parsed.data.published : false, createdAt: now, updatedAt: now, createdBy: session.email, submittedByRole: session.role };
    const result = await db.collection("media").insertOne(doc);
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
    const parsed = mediaSchema.partial().safeParse(input);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
    const db = await getDb();
    const result = await db.collection("media").updateOne({ _id: new ObjectId(id) }, { $set: { ...parsed.data, updatedAt: new Date() } });
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
    const collection = db.collection("media");
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    if (existing.published === true) return NextResponse.json({ error: "Move this item to Pending before deleting it permanently." }, { status: 409 });

    // Delete the underlying Cloudinary asset too, so removing a pending photo/video
    // also frees its storage rather than only removing the MongoDB record.
    if (typeof existing.url === "string" && existing.provider === "cloudinary") {
      const marker = "/upload/";
      const uploadIndex = existing.url.indexOf(marker);
      if (uploadIndex >= 0) {
        const afterUpload = existing.url.slice(uploadIndex + marker.length).split("?")[0];
        const segments = afterUpload.split("/").filter(Boolean).filter((part) => !/^v\d+$/.test(part));
        const last = segments.length - 1;
        if (last >= 0) segments[last] = segments[last].replace(/\.[^.]+$/, "");
        const publicId = segments.join("/");
        if (publicId) {
          const resourceType = existing.type === "video" ? "video" : "image";
          const deletion = await getCloudinary().uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
          if (deletion.result !== "ok" && deletion.result !== "not found") {
            return NextResponse.json({ error: "Cloudinary could not delete this file. The media record was kept; try again." }, { status: 502 });
          }
        }
      }
    }
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 503 });
  }
}
