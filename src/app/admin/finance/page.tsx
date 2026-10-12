import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import FinanceDashboard from "./FinanceDashboard";
export const dynamic = "force-dynamic";
export default async function FinancePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <main className="min-h-screen bg-[#FFF9EE] px-4 py-8 text-[#321B1A] sm:px-6"><div className="mx-auto max-w-7xl"><Link href="/admin" className="text-sm font-bold text-[#8A2631]">← Back to organizer dashboard</Link><FinanceDashboard /></div></main>;
}
