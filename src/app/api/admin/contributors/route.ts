import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const requests = await db.collection("contributorRequests").find({ status: "pending" }, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(200).toArray();
    return NextResponse.json({ data: requests.map(r => ({ ...r, _id: r._id.toString() })) });
  } catch (e) { const msg = e instanceof Error ? e.message : "Request failed"; return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 503 }); }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as { id?: string; decision?: string };
    if (!body.id || !ObjectId.isValid(body.id) || !["approve", "reject"].includes(body.decision || "")) return NextResponse.json({ error: "Valid request id and decision are required." }, { status: 400 });
    const db = await getDb();
    const item = await db.collection("contributorRequests").findOne({ _id: new ObjectId(body.id), status: "pending" });
    if (!item) return NextResponse.json({ error: "Pending request not found." }, { status: 404 });
    if (body.decision === "approve") {
      await db.collection("contributors").updateOne({ email: item.email }, { $set: { name: item.name, email: item.email, passwordHash: item.passwordHash, status: "approved", approvedAt: new Date() } }, { upsert: true });
    }
    await db.collection("contributorRequests").updateOne({ _id: item._id }, { $set: { status: body.decision === "approve" ? "approved" : "rejected", reviewedAt: new Date() }, $unset: { passwordHash: "" } });
    return NextResponse.json({ ok: true });
  } catch (e) { const msg = e instanceof Error ? e.message : "Request failed"; return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 503 }); }
}
