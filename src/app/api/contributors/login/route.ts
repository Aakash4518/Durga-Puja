import { NextResponse } from "next/server";
import { timingSafeEqual, scryptSync } from "node:crypto";
import { getDb } from "@/lib/mongodb";
import { createContributorSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const db = await getDb();
    const user = await db.collection("contributors").findOne({ email, status: "approved" });
    if (!user || typeof user.passwordHash !== "string") return NextResponse.json({ error: "Invalid credentials or contributor access not approved yet." }, { status: 401 });
    const [salt, storedHex] = user.passwordHash.split(":");
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHex, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    await createContributorSession(email);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not sign in. Check database configuration." }, { status: 503 }); }
}
