import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession } from "@/lib/auth";

function safeCompare(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export async function POST(request: Request) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json({ error: "Admin credentials are not configured on the server." }, { status: 503 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const { email, password } = (body && typeof body === "object" ? body : {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" ||
      !safeCompare(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase()) ||
      !safeCompare(password, expectedPassword)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  try {
    await createAdminSession(expectedEmail);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 500 });
  }
}
