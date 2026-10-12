"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function ContributePage() {
 const router = useRouter();
 const [mode,setMode]=useState<"request"|"login">("request");
 const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [reason,setReason]=useState("");
 const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{
  const res=await fetch(mode==="request"?"/api/contributors/request":"/api/contributors/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="request"?{name,email,password,reason}:{email,password})});
  const data=await res.json(); if(!res.ok) throw new Error(data.error||"Request failed");
  if(mode==="login"){router.push("/contribute/upload");router.refresh();} else {setMessage(data.message||"Request submitted.")}
 }catch(err){setMessage(err instanceof Error?err.message:"Request failed");}finally{setBusy(false)}}
 return <main className="min-h-screen bg-[#FFF9EE] px-5 py-12 text-[#321B1A]"><div className="mx-auto max-w-lg rounded-3xl border border-[#EAD9BD] bg-white p-7 shadow-sm">
 <Link href="/" className="text-sm font-bold text-[#8A2631]">← Back to mela website</Link><p className="mt-6 text-xs font-black tracking-[.2em] text-[#A66A2B]">COMMUNITY MEMORIES</p><h1 className="mt-2 text-3xl font-black text-[#571E24]">Contribute photos & videos</h1><p className="mt-3 text-sm leading-6 text-[#80675E]">Request contributor access. An organiser must approve your request before you can sign in and submit media. Submissions are reviewed before public display.</p>
 <div className="mt-6 grid grid-cols-2 gap-2"><button onClick={()=>{setMode("request");setMessage("")}} className={`rounded-xl px-3 py-3 text-sm font-bold ${mode==="request"?"bg-[#8A2631] text-white":"bg-[#FFF2D8] text-[#571E24]"}`}>Request access</button><button onClick={()=>{setMode("login");setMessage("")}} className={`rounded-xl px-3 py-3 text-sm font-bold ${mode==="login"?"bg-[#8A2631] text-white":"bg-[#FFF2D8] text-[#571E24]"}`}>Contributor sign in</button></div>
 <form onSubmit={submit} className="mt-5 space-y-4">{mode==="request"&&<><label className="block text-sm font-semibold">Full name<input required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"/></label><label className="block text-sm font-semibold">Why would you like to contribute?<textarea required minLength={10} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"/></label></>}
 <label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"/></label><label className="block text-sm font-semibold">Password (minimum 10 characters)<input required minLength={10} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"/></label>
 <button disabled={busy} className="w-full rounded-xl bg-[#8A2631] px-4 py-3 font-bold text-white disabled:opacity-60">{busy?"Please wait…":mode==="request"?"Submit access request":"Sign in"}</button></form>
 {message&&<p role="status" className="mt-4 rounded-xl bg-[#FFF2D8] p-3 text-sm">{message}</p>}
 </div></main>
}
