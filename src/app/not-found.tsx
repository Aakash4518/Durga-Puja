import Link from "next/link";
export default function NotFound() {
  return <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF9EE] px-5 text-center"><p className="text-sm font-bold tracking-[0.2em] text-[#A36A2B]">404 · NOT FOUND</p><h1 className="mt-3 text-4xl font-black text-[#571E24]">This page is not in the mela map.</h1><p className="mt-4 text-[#80675E]">The page may have moved or is not available yet.</p><Link className="mt-7 rounded-full bg-[#8B1E2D] px-6 py-3 font-bold text-white" href="/">Back to homepage</Link></main>;
}
