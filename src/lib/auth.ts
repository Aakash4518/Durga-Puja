import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "lcm_admin_session";
const secretValue = process.env.APP_SESSION_SECRET;

function secret() {
  if (!secretValue || secretValue.length < 32) {
    throw new Error("APP_SESSION_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secretValue);
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "admin" || typeof payload.email !== "string") return null;
    return { email: payload.email, role: "admin" as const };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}


const CONTRIBUTOR_COOKIE = "lcm_contributor_session";

export async function createContributorSession(email: string) {
  const token = await new SignJWT({ role: "contributor", email })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
  const store = await cookies();
  store.set(CONTRIBUTOR_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 60 * 60 * 8,
  });
}

export async function getContributorSession() {
  const store = await cookies();
  const token = store.get(CONTRIBUTOR_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "contributor" || typeof payload.email !== "string") return null;
    return { email: payload.email, role: "contributor" as const };
  } catch { return null; }
}

export async function requireContributor() {
  const session = await getContributorSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
