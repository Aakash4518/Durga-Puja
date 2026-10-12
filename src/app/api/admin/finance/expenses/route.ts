import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClient, getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({
  vendorName: z.string().trim().min(1).max(120),
  category: z.enum(["decoration", "electricity", "sound", "tent", "prasad_food", "cleaning", "transport", "permissions", "other"]),
  description: z.string().trim().min(1).max(300),
  amountRupees: z.number().finite().positive().max(10000000),
  incurredOn: z.string().date(),
  billReference: z.string().trim().max(120).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});
function apiError(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Please log in as an administrator." }, { status: 401 });
  console.error("Finance expense API failed.");
  return NextResponse.json({ error: "Unable to process this expense. Check the database connection and try again." }, { status: 500 });
}
export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const rows = await db.collection("financeExpenses").find({}).sort({ createdAt: -1 }).limit(1000).toArray();
    return NextResponse.json({ expenses: rows.map((r) => ({ ...r, _id: String(r._id), amountRupees: Number(r.amountPaise || 0) / 100 })) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check vendor, category, description, amount, and date." }, { status: 400 });
    const input = parsed.data;
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DB || "laxman_chhapra_mela");
    const now = new Date();
    const expenseNumber = `EXP-${input.incurredOn.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const record = { ...input, amountPaise: Math.round(input.amountRupees * 100), expenseNumber, status: "approved", paymentStatus: "unpaid", submittedBy: session.email, approvedBy: session.email, approvedAt: now, approvals: [{ email: session.email, at: now, decision: "approved" }], createdAt: now, updatedAt: now };
    const mongoSession = client.startSession();
    let insertedId = "";
    try {
      await mongoSession.withTransaction(async () => {
        const result = await db.collection("financeExpenses").insertOne(record, { session: mongoSession });
        insertedId = String(result.insertedId);
        await db.collection("financeAuditLogs").insertOne({ action: "expense.recorded_and_approved_by_admin", recordType: "expense", recordId: insertedId, recordNumber: expenseNumber, actor: session.email, details: { amountPaise: record.amountPaise, paymentStatus: "unpaid" }, createdAt: new Date() }, { session: mongoSession });
      });
    } finally { await mongoSession.endSession(); }
    return NextResponse.json({ ok: true, id: insertedId, expenseNumber, message: "Expense recorded and approved by admin. Payment is still marked unpaid." }, { status: 201 });
  } catch (error) { return apiError(error); }
}
