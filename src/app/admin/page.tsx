import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { CalendarDays, Images, Megaphone, Store, LogOut, ExternalLink, Wallet } from "lucide-react";
import AdminMediaManager from "./MediaManager";
import ContributorRequests from "./ContributorRequests";
import ContentManager from "./ContentManager";

const sections = [
  { title: "Finance & accounts", href: "/admin/finance", icon: Wallet, description: "Record donations and expenses, track payments, export CSV reports, and review the finance audit history." },
  { title: "Stalls", href: "/admin?section=stalls#content-manager", icon: Store, description: "Manage vendor listings, categories and approval status." },
  { title: "Events", href: "/admin?section=events#content-manager", icon: CalendarDays, description: "Create and update Puja schedules and cultural programmes." },
  { title: "Announcements", href: "/admin?section=announcements#content-manager", icon: Megaphone, description: "Publish notices for visitors and the community." },
  { title: "Media records", href: "/admin#media-manager", icon: Images, description: "Manage metadata for photos and video archive entries." },
];

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return (
    <main className="min-h-screen bg-[#FFF9EE] px-5 py-10 text-[#321B1A]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold tracking-[0.2em] text-[#A36A2B]">LAXMAN CHHAPRA MELA</p><h1 className="mt-2 text-3xl font-black text-[#571E24]">Organizer dashboard</h1><p className="mt-2 text-sm text-[#80675E]">Signed in as {session.email}</p></div>
          <div className="flex gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-[#EAD9BD] px-4 py-3 text-sm font-semibold"><ExternalLink className="h-4 w-4" /> View site</Link><form action="/api/admin/logout" method="post"><button className="inline-flex items-center gap-2 rounded-xl bg-[#741925] px-4 py-3 text-sm font-bold text-white"><LogOut className="h-4 w-4" /> Sign out</button></form></div>
        </div>
        <div className="mt-8 rounded-2xl border border-[#EAD9BD] bg-white p-5 text-sm leading-6 text-[#80675E]">Use the management panel below to create, edit, publish/unpublish, and delete stalls, events, and announcements. Contributor requests and submitted media are reviewed in their own sections below.</div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sections.map(({ title, href, icon: Icon, description }) => <a key={title} href={href} className="admin-dashboard-card rounded-2xl border border-[#EAD9BD] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EBD2] text-[#8A2631]"><Icon /></div><h2 className="mt-5 text-xl font-bold text-[#571E24]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#80675E]">{description}</p><p className="mt-4 text-sm font-bold text-[#8A2631]">Open management →</p></a>)}
        </div>
        <ContentManager />
        <ContributorRequests />
        <AdminMediaManager />
      </div>
    </main>
  );
}
