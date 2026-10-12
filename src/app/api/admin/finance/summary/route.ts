import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const [donations, expenses] = await Promise.all([
      db.collection("financeDonations").find({}).toArray(),
      db.collection("financeExpenses").find({}).toArray(),
    ]);
    const validDonations = donations.filter((x) => x.status === "received");
    const validExpenses = expenses.filter((x) => x.status !== "voided" && x.status !== "rejected");
    const totalDonationsPaise = validDonations.reduce((s, x) => s + Number(x.amountPaise || 0), 0);
    const approvedExpensePaise = validExpenses.filter((x) => x.status === "approved").reduce((s, x) => s + Number(x.amountPaise || 0), 0);
    const paidExpensePaise = validExpenses.filter((x) => x.status === "approved" && x.paymentStatus === "paid").reduce((s, x) => s + Number(x.amountPaise || 0), 0);
    return NextResponse.json({ totals: { donationRupees: totalDonationsPaise / 100, approvedExpenseRupees: approvedExpensePaise / 100, paidExpenseRupees: paidExpensePaise / 100, unpaidApprovedRupees: (approvedExpensePaise - paidExpensePaise) / 100, cashPositionRupees: (totalDonationsPaise - paidExpensePaise) / 100, donationCount: validDonations.length, expenseCount: validExpenses.length } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Please log in as an administrator." }, { status: 401 });
    console.error("Finance summary failed.");
    return NextResponse.json({ error: "Unable to load financial summary." }, { status: 500 });
  }
}
