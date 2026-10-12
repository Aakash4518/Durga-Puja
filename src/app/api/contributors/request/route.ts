import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string; reason?: string };
    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const reason = body.reason?.trim() || "";
    if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || reason.length < 10) {
      return NextResponse.json({ error: "Provide a name, valid email, password (10+ characters), and a short reason (10+ characters)." }, { status: 400 });
    }
    const db = await getDb();
    const existing = await db.collection("contributorRequests").findOne({ email });
    if (existing) return NextResponse.json({ error: "A request for this email already exists." }, { status: 409 });
    const approved = await db.collection("contributors").findOne({ email });
    if (approved) return NextResponse.json({ error: "This email is already an approved contributor. Please sign in." }, { status: 409 });
    // Password is hashed before storage. Pending requests cannot sign in.
    const { randomBytes, scryptSync } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
    await db.collection("contributorRequests").insertOne({ name, email, reason, passwordHash, status: "pending", createdAt: new Date() });
    return NextResponse.json({ ok: true, message: "Request submitted. An admin must approve it before you can sign in." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit request. Check MongoDB configuration." }, { status: 503 });
  }
}
