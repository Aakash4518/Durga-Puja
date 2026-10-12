import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { writeFinanceAudit } from "@/lib/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("void"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("mark_paid"), paidOn: z.string().date(), paymentReference: z.string().trim().max(120).optional().default("") }),
  z.object({ action: z.literal("mark_unpaid"), reason: z.string().trim().min(3).max(500) }),
]);
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid expense ID." }, { status: 400 });
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Provide a valid action and the required reason/date." }, { status: 400 });
    const action = parsed.data;
    const db = await getDb();
    const collection = db.collection("financeExpenses");
    const before = await collection.findOne({ _id: new ObjectId(id) });
    if (!before) return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    if (before.status === "voided") return NextResponse.json({ error: "This expense is already voided." }, { status: 409 });
    let update: Record<string, unknown>;
    let auditAction: string;
    let reason: string | undefined;
    if (action.action === "reject") {
      if (before.paymentStatus === "paid") return NextResponse.json({ error: "A paid expense cannot be rejected. Reconcile the payment first, then use the appropriate audited correction." }, { status: 409 });
      update = { status: "rejected", rejectedBy: session.email, rejectedAt: new Date(), rejectionReason: action.reason, updatedAt: new Date() };
      auditAction = "expense.rejected"; reason = action.reason;
    } else if (action.action === "void") {
      if (before.paymentStatus === "paid") return NextResponse.json({ error: "This expense is marked paid. Reconcile or document the payment before voiding it so the cash records remain accurate." }, { status: 409 });
      update = { status: "voided", voidedBy: session.email, voidedAt: new Date(), voidReason: action.reason, updatedAt: new Date() };
      auditAction = "expense.voided"; reason = action.reason;
    } else if (action.action === "mark_paid") {
      if (before.status !== "approved") return NextResponse.json({ error: "Only approved expenses can be marked paid." }, { status: 409 });
      update = { paymentStatus: "paid", paidOn: action.paidOn, paymentReference: action.paymentReference, paidBy: session.email, paidAt: new Date(), updatedAt: new Date() };
      auditAction = "expense.marked_paid";
    } else {
      update = { paymentStatus: "unpaid", paymentReversedBy: session.email, paymentReversedAt: new Date(), paymentReversalReason: action.reason, updatedAt: new Date() };
      auditAction = "expense.marked_unpaid"; reason = action.reason;
    }
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    await writeFinanceAudit(db, { action: auditAction, recordType: "expense", recordId: id, recordNumber: String(before.expenseNumber || ""), actor: session.email, reason });
    return NextResponse.json({ ok: true, message: "Expense updated." });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Please log in as an administrator." }, { status: 401 });
    console.error("Finance expense action failed.");
    return NextResponse.json({ error: "Unable to update the expense." }, { status: 500 });
  }
}
