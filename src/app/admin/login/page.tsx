"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed.");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9EE] px-5 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#EAD9BD] bg-white p-8 shadow-xl shadow-[#571E24]/5">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#741925] text-[#F5C66F]"><LockKeyhole /></div>
        <p className="text-xs font-bold tracking-[0.2em] text-[#A36A2B]">ORGANIZER ACCESS</p>
        <h1 className="mt-2 text-3xl font-black text-[#571E24]">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-[#80675E]">Sign in with the credentials configured in your server environment.</p>
        <label className="mt-6 block text-sm font-semibold text-[#571E24]">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded-xl border border-[#EAD9BD] bg-[#FFFCF5] px-4 py-3 outline-none focus:border-[#8A2631]" />
        <label className="mt-4 block text-sm font-semibold text-[#571E24]">Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-[#EAD9BD] bg-[#FFFCF5] px-4 py-3 outline-none focus:border-[#8A2631]" />
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B1E2D] px-4 py-3 font-bold text-white transition hover:bg-[#67151F] disabled:opacity-60"><ShieldCheck className="h-4 w-4" /> {busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}
