import type { Db } from "mongodb";

export async function writeFinanceAudit(
  db: Db,
  entry: {
    action: string;
    recordType: "donation" | "expense";
    recordId: string;
    recordNumber?: string;
    actor: string;
    reason?: string;
    details?: Record<string, unknown>;
  },
) {
  await db.collection("financeAuditLogs").insertOne({ ...entry, createdAt: new Date() });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
