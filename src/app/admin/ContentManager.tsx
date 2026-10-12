"use client";
import { useCallback, useEffect, useState } from "react";

type Section = "stalls" | "events" | "announcements";
type RecordItem = Record<string, unknown> & { _id: string; name?: string; title?: string; category?: string; status?: string; description?: string; area?: string; stallNumber?: string; startTime?: string; endTime?: string; location?: string; content?: string; phone?: string; shopImageUrl?: string; shopImages?: string[] };
const blank = { name: "", category: "Food & Drinks", description: "", area: "", stallNumber: "", phone: "", shopImageUrl: "", startTime: "", endTime: "", location: "", content: "", status: "draft" };
const inputClass = "mt-1 w-full rounded-lg border border-[#EAD9BD] bg-white px-3 py-2 text-sm font-normal text-[#321B1A]";

export default function ContentManager() {
  const [section, setSection] = useState<Section>("stalls");
  const [form, setForm] = useState({ ...blank, status: "published" });
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shopImageFiles, setShopImageFiles] = useState<File[]>([]);

  const load = useCallback(async (target: Section = section) => {
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/${target}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load records");
      setRecords((data.data || []).map((item: RecordItem) => ({ ...item, _id: String(item._id) })));
    } catch (error) { setRecords([]); setMessage(error instanceof Error ? error.message : "Could not load records"); }
    finally { setLoading(false); }
  }, [section]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section");
    if (requested === "stalls" || requested === "events" || requested === "announcements") {
      setSection(requested);
    }
  }, []);
  useEffect(() => { void load(section); }, [section, load]);
  function change(key: keyof typeof blank, value: string) { setForm(current => ({ ...current, [key]: value })); }
  function resetForm() { setForm({ ...blank, status: section === "stalls" ? "published" : "draft" }); setShopImageFiles([]); setEditingId(null); }
  function edit(item: RecordItem) {
    setEditingId(item._id);
    setShopImageFiles([]);
    setForm({
      ...blank,
      name: String(item.name ?? item.title ?? ""), category: String(item.category ?? "Food & Drinks"),
      description: String(item.description ?? ""), area: String(item.area ?? ""), stallNumber: String(item.stallNumber ?? ""), phone: String(item.phone ?? item.contact ?? ""), shopImageUrl: String(item.shopImageUrl ?? item.imageUrl ?? ""),
      startTime: item.startTime ? new Date(String(item.startTime)).toISOString().slice(0, 16) : "",
      endTime: item.endTime ? new Date(String(item.endTime)).toISOString().slice(0, 16) : "",
      location: String(item.location ?? ""), content: String(item.content ?? ""), status: String(item.status ?? "draft"),
    });
    document.getElementById("content-manager-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    let payload: Record<string, unknown>;
    if (section === "stalls") {
      let shopImageUrl = form.shopImageUrl;
      const existingImages = Array.isArray((records.find(item => item._id === editingId) as RecordItem | undefined)?.shopImages)
        ? ((records.find(item => item._id === editingId) as RecordItem).shopImages as string[])
        : (shopImageUrl ? [shopImageUrl] : []);
      const uploadedImages: string[] = [];
      try {
        for (const file of shopImageFiles) {
          if (!file.type.startsWith("image/")) throw new Error("Please select image files for the vendor shop.");
          if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: vendor images must be 10 MB or smaller.`);
          const instructionResponse = await fetch("/api/admin/upload-instruction", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: "cloudinary", fileName: file.name, contentType: file.type, size: file.size, resourceType: "image" }),
          });
          const instruction = await instructionResponse.json();
          if (!instructionResponse.ok) throw new Error(instruction.error || "Could not prepare the image upload.");
          const uploadForm = new FormData();
          uploadForm.append("file", file);
          for (const [key, value] of Object.entries(instruction.fields || {})) uploadForm.append(key, String(value));
          const uploadResponse = await fetch(instruction.uploadUrl, { method: "POST", body: uploadForm });
          const uploaded = await uploadResponse.json();
          if (!uploadResponse.ok || !uploaded.secure_url) throw new Error(uploaded.error?.message || `Cloudinary upload failed for ${file.name}.`);
          uploadedImages.push(uploaded.secure_url as string);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Vendor image upload failed.");
        setBusy(false);
        return;
      }
      const shopImages = [...existingImages, ...uploadedImages].filter((url, index, all) => all.indexOf(url) === index);
      if (shopImages.length) shopImageUrl = shopImages[0];
      payload = { name: form.name, category: form.category, description: form.description, area: form.area, stallNumber: form.stallNumber, phone: form.phone, shopImageUrl: shopImageUrl || undefined, shopImages, status: form.status };
    }
    else if (section === "events") {
      if (!form.startTime) { setMessage("Please select an event start date and time."); setBusy(false); return; }
      payload = { title: form.name, description: form.description, startTime: new Date(form.startTime).toISOString(), ...(form.endTime ? { endTime: new Date(form.endTime).toISOString() } : {}), location: form.location, status: form.status };
    } else payload = { title: form.name, content: form.content, status: form.status };
    try {
      const response = await fetch(`/api/admin/${section}`, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not save record");
      setMessage(editingId ? "Changes saved." : "Record created."); resetForm(); await load(section);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save record"); }
    finally { setBusy(false); }
  }
  async function unpublish(item: RecordItem) {
    const label = String(item.name ?? item.title ?? "this record");
    if (!window.confirm(`Move “${label}” to Pending? It will disappear from the public website.`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/${section}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item._id, status: "pending" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not unpublish record");
      setMessage("Moved to Pending and hidden from the public website."); await load(section);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not unpublish record"); }
  }
  async function remove(item: RecordItem) {
    if (item.status === "published") { setMessage("Unpublish this item first. Only Pending/Draft items can be permanently deleted."); return; }
    const label = String(item.name ?? item.title ?? "this record");
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    setMessage("");
    try { const response = await fetch(`/api/admin/${section}?id=${encodeURIComponent(item._id)}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Delete failed"); setMessage("Record deleted."); if (editingId === item._id) resetForm(); await load(section); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Delete failed"); }
  }
  const statuses = section === "stalls" ? ["draft", "pending", "published", "rejected"] : section === "events" ? ["draft", "pending", "published", "cancelled"] : ["draft", "pending", "published"];
  return <section id="content-manager" className="mt-8 scroll-mt-6 rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-7">
    <h2 className="text-xl font-black text-[#571E24]">Mela content manager</h2><p className="mt-2 text-sm text-[#80675E]">Create, edit, publish, unpublish, and delete stalls, events, and announcements.</p>
    <div className="mt-5 flex flex-wrap gap-2">{(["stalls", "events", "announcements"] as Section[]).map(s => <button type="button" key={s} onClick={() => { setSection(s); setForm({ ...blank, status: s === "stalls" ? "published" : "draft" }); setEditingId(null); setMessage(""); }} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${section === s ? "bg-[#8A2631] text-white" : "bg-[#FFF2D8] text-[#571E24]"}`}>{s}</button>)}</div>
    <div id="content-manager-form" className="mt-6 scroll-mt-6 rounded-xl bg-[#FFFAF1] p-4 sm:p-5"><h3 className="font-bold text-[#571E24]">{editingId ? "Edit" : "Add new"} {section === "stalls" ? "stall" : section === "events" ? "event" : "announcement"}</h3>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#571E24]">{section === "stalls" ? "Vendor / stall name" : "Title"}<input required minLength={2} maxLength={160} value={form.name} onChange={e => change("name", e.target.value)} className={inputClass}/></label>
        {section === "stalls" && <><label className="text-sm font-semibold">Category<select value={form.category} onChange={e => change("category", e.target.value)} className={inputClass}><option>Food & Drinks</option><option>Shopping</option><option>Fun & Attractions</option><option>Other</option></select></label><label className="text-sm font-semibold">Stall number<input value={form.stallNumber} onChange={e => change("stallNumber", e.target.value)} className={inputClass}/></label><label className="text-sm font-semibold">Shop address / area<input value={form.area} onChange={e => change("area", e.target.value)} className={inputClass} placeholder="Full address or mela area"/></label><label className="text-sm font-semibold">Mobile / phone number<input type="tel" value={form.phone} onChange={e => change("phone", e.target.value)} className={inputClass} placeholder="Vendor contact number"/></label><label className="text-sm font-semibold sm:col-span-2">Vendor shop photos (select multiple)<input type="file" accept="image/*" multiple onChange={e => setShopImageFiles(Array.from(e.target.files || []))} className={inputClass}/><span className="mt-1 block text-xs font-normal text-[#80675E]">Select multiple shop photos. Each image uploads to Cloudinary (max 10 MB each). New photos are added to existing photos when editing.</span>{shopImageFiles.length > 0 && <span className="block text-xs text-[#571E24]">Selected {shopImageFiles.length} new photo(s): {shopImageFiles.map(file => file.name).join(", ")}</span>}{(() => { const current = records.find(item => item._id === editingId); const images = Array.isArray(current?.shopImages) ? current.shopImages as string[] : (form.shopImageUrl ? [form.shopImageUrl] : []); return images.length > 0 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{images.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Current vendor photo ${index + 1}`} className="h-20 w-28 shrink-0 rounded-lg border border-[#EAD9BD] object-cover" />)}</div> : null; })()}</label></>}
        {section === "events" && <><label className="text-sm font-semibold">Start date/time<input required type="datetime-local" value={form.startTime} onChange={e => change("startTime", e.target.value)} className={inputClass}/></label><label className="text-sm font-semibold">End date/time (optional)<input type="datetime-local" value={form.endTime} onChange={e => change("endTime", e.target.value)} className={inputClass}/></label><label className="text-sm font-semibold">Location<input value={form.location} onChange={e => change("location", e.target.value)} className={inputClass}/></label></>}
        {section === "announcements" && <label className="text-sm font-semibold">Announcement content<textarea required minLength={2} maxLength={2000} value={form.content} onChange={e => change("content", e.target.value)} rows={3} className={inputClass}/></label>}
        {section !== "announcements" && <label className="text-sm font-semibold sm:col-span-2">Description<textarea maxLength={1000} value={form.description} onChange={e => change("description", e.target.value)} rows={3} className={inputClass}/></label>}
        <label className="text-sm font-semibold">Status<select value={form.status} onChange={e => change("status", e.target.value)} className={inputClass}>{statuses.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></label>
        <div className="flex items-end gap-2"><button disabled={busy} className="rounded-xl bg-[#8A2631] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : editingId ? "Save changes" : `Create ${section === "stalls" ? "stall" : section === "events" ? "event" : "announcement"}`}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-[#EAD9BD] px-4 py-3 text-sm font-bold">Cancel edit</button>}</div>
      </form></div>
    <div className="mt-7"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-[#571E24]">Existing {section} <span className="font-normal text-[#80675E]">({records.length})</span></h3><button type="button" onClick={() => void load(section)} className="rounded-lg border border-[#EAD9BD] px-3 py-2 text-sm font-semibold">Refresh list</button></div>
      {message && <p role="status" className="mt-3 rounded-lg bg-[#FFF2D8] p-3 text-sm text-[#571E24]">{message}</p>}
      {loading ? <p className="py-8 text-sm text-[#80675E]">Loading records…</p> : records.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-[#EAD9BD] p-6 text-sm text-[#80675E]">No records found for this section yet.</p> : <div className="mt-3 overflow-x-auto rounded-xl border border-[#EAD9BD]"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#FFF2D8] text-[#571E24]"><tr><th className="px-4 py-3">Name / title</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{records.map(item => <tr key={item._id} className="border-t border-[#F0E4D1]"><td className="max-w-[240px] px-4 py-3 font-semibold">{String(item.name ?? item.title ?? "Untitled")}</td><td className="max-w-[280px] px-4 py-3 text-[#80675E]">{section === "stalls" ? [item.category, item.stallNumber ? `Stall ${item.stallNumber}` : "", item.area, item.phone].filter(Boolean).join(" · ") || String(item.description ?? "—") : section === "events" ? [item.startTime ? new Date(String(item.startTime)).toLocaleString() : "", item.location].filter(Boolean).join(" · ") || String(item.description ?? "—") : String(item.content ?? "—")}</td><td className="px-4 py-3"><span className="rounded-full bg-[#F8EBD2] px-2.5 py-1 text-xs font-bold capitalize">{String(item.status ?? "draft")}</span></td><td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => edit(item)} className="rounded-lg border border-[#EAD9BD] px-3 py-2 font-semibold">Edit</button><button type="button" onClick={() => void unpublish(item)} disabled={item.status !== "published"} className="rounded-lg border border-amber-200 px-3 py-2 font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-40">Unpublish</button><button type="button" onClick={() => void remove(item)} disabled={item.status === "published"} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Delete permanently</button></div></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
