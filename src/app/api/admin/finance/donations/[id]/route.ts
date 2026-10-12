import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { writeFinanceAudit } from "@/lib/finance";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ reason: z.string().trim().min(3).max(500) });
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid donation ID." }, { status: 400 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "A reason of at least 3 characters is required." }, { status: 400 });
    const db = await getDb();
    const collection = db.collection("financeDonations");
    const record = await collection.findOne({ _id: new ObjectId(id) });
    if (!record) return NextResponse.json({ error: "Donation not found." }, { status: 404 });
    if (record.status === "voided") return NextResponse.json({ error: "Donation is already voided." }, { status: 409 });
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: { status: "voided", voidedBy: session.email, voidedAt: new Date(), voidReason: parsed.data.reason, updatedAt: new Date() } });
    await writeFinanceAudit(db, { action: "donation.voided", recordType: "donation", recordId: id, recordNumber: String(record.receiptNumber || ""), actor: session.email, reason: parsed.data.reason });
    return NextResponse.json({ ok: true, message: "Donation marked void; the record remains in the audit trail." });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Please log in as an administrator." }, { status: 401 });
    console.error("Finance donation action failed.");
    return NextResponse.json({ error: "Unable to update the donation." }, { status: 500 });
  }
}
