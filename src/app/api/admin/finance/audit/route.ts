import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const rows = await db.collection("financeAuditLogs").find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ logs: rows.map((r) => ({ ...r, _id: String(r._id) })) });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Please log in as an administrator." }, { status: 401 });
    console.error("Finance audit log failed.");
    return NextResponse.json({ error: "Unable to load audit history." }, { status: 500 });
  }
}
