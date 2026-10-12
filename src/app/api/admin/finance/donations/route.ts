import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClient, getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({
  donorName: z.string().trim().min(1).max(120),
  amountRupees: z.number().finite().positive().max(10000000),
  paymentMethod: z.enum(["cash", "upi", "bank_transfer", "cheque", "other"]),
  receivedOn: z.string().date(),
  reference: z.string().trim().max(120).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});
function apiError(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Please log in as an administrator." }, { status: 401 });
  console.error("Finance donation API failed.");
  return NextResponse.json({ error: "Unable to process this donation. Check the database connection and try again." }, { status: 500 });
}
export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const rows = await db.collection("financeDonations").find({}).sort({ createdAt: -1 }).limit(1000).toArray();
    return NextResponse.json({ donations: rows.map((r) => ({ ...r, _id: String(r._id), amountRupees: Number(r.amountPaise || 0) / 100 })) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check donor, amount, date, and payment details." }, { status: 400 });
    const input = parsed.data;
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DB || "laxman_chhapra_mela");
    const now = new Date();
    const receiptNumber = `DON-${input.receivedOn.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const record = { ...input, amountPaise: Math.round(input.amountRupees * 100), receiptNumber, status: "received", enteredBy: session.email, createdAt: now, updatedAt: now };
    const mongoSession = client.startSession();
    let insertedId = "";
    try {
      await mongoSession.withTransaction(async () => {
        const result = await db.collection("financeDonations").insertOne(record, { session: mongoSession });
        insertedId = String(result.insertedId);
        await db.collection("financeAuditLogs").insertOne({ action: "donation.recorded", recordType: "donation", recordId: insertedId, recordNumber: receiptNumber, actor: session.email, details: { amountPaise: record.amountPaise, paymentMethod: input.paymentMethod }, createdAt: new Date() }, { session: mongoSession });
      });
    } finally { await mongoSession.endSession(); }
    return NextResponse.json({ ok: true, id: insertedId, receiptNumber, message: "Donation recorded." }, { status: 201 });
  } catch (error) { return apiError(error); }
}
