"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UploadCloud, RefreshCw, CheckCircle, XCircle, Images } from "lucide-react";

type MediaRecord = { _id: string; title: string; caption?: string; year: number; eventName?: string; type: "image" | "video"; provider: string; url: string; published: boolean; createdAt?: string };

export default function AdminMediaManager() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [eventName, setEventName] = useState("Puja & Aarti");
  const provider = "cloudinary" as const;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch("/api/admin/media", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load media.");
    setItems(data.data || []);
  }
  useEffect(() => { refresh().catch(e => setMessage(e.message)); }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Choose a photo or video first.");
    if (!title.trim()) return setMessage("Add a title.");
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return setMessage("Only image and video files are allowed.");
    if (file.size > (isImage ? 10 : 100) * 1024 * 1024) return setMessage(isImage ? "Photo must be 10 MB or smaller." : "Video must be 100 MB or smaller.");
    setBusy(true); setMessage("Preparing secure upload…");
    try {
      const instructionResponse = await fetch("/api/admin/upload-instruction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, fileName: file.name, contentType: file.type, size: file.size, resourceType: isVideo ? "video" : "image" })
      });
      const instruction = await instructionResponse.json();
      if (!instructionResponse.ok) throw new Error(instruction.error || "Could not prepare upload.");
      let url = "";
      const form = new FormData();
      form.append("file", file);
      for (const [key, value] of Object.entries(instruction.fields || {})) form.append(key, String(value));
      const cloud = await fetch(instruction.uploadUrl, { method: "POST", body: form });
      const result = await cloud.json();
      if (!cloud.ok || !result.secure_url) throw new Error(result.error?.message || "Cloudinary upload failed.");
      url = result.secure_url;
      const recordResponse = await fetch("/api/admin/media", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), caption, year, eventName, type: isImage ? "image" : "video", provider, url, published: false })
      });
      const record = await recordResponse.json();
      if (!recordResponse.ok) throw new Error(record.error || "File uploaded, but metadata could not be saved. Contact the administrator.");
      setMessage("Upload complete. It is pending review and is not public yet.");
      setTitle(""); setCaption(""); setFile(null);
      const input = document.getElementById("media-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function setPublished(item: MediaRecord, published: boolean) {
    setMessage("");
    try {
      const response = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item._id, published }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed.");
      await refresh();
      setMessage(published ? "Media published." : "Media moved to Pending. Delete it from the queue to permanently remove its database record.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Update failed."); }
  }

  async function deleteMedia(item: MediaRecord) {
    if (item.published) { setMessage("Move this item to Pending before deleting it permanently."); return; }
    if (!window.confirm(`Permanently delete “${item.title}” from the media database? The Cloudinary file itself will remain in Cloudinary.`)) return;
    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(item._id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Delete failed.");
      await refresh(); setMessage("Media record permanently deleted from the website database. Remove the file from Cloudinary separately if you also want to free storage.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Delete failed."); }
  }

  return <div className="mt-8 space-y-8">
    <section className="rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-7">
      <h2 className="flex items-center gap-2 text-xl font-black text-[#571E24]"><UploadCloud /> Upload a memory</h2>
      <p className="mt-2 text-sm leading-6 text-[#80675E]">Admin-only upload in this release. Every upload starts unpublished; review it before publishing.</p>
      <form onSubmit={upload} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#571E24]">Title<input required value={title} onChange={e => setTitle(e.target.value)} maxLength={160} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label>
        <label className="text-sm font-semibold text-[#571E24]">Year<input required type="number" min={2000} max={2100} value={year} onChange={e => setYear(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label>
        <label className="text-sm font-semibold text-[#571E24]">Event<input value={eventName} onChange={e => setEventName(e.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label>
        <div className="text-sm font-semibold text-[#571E24]">Storage provider<div className="mt-2 rounded-xl border border-[#EAD9BD] bg-[#FFFAF1] px-3 py-3 font-normal">Cloudinary (photos and videos)</div></div>
        <label className="text-sm font-semibold text-[#571E24] sm:col-span-2">Caption<textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label>
        <label className="text-sm font-semibold text-[#571E24] sm:col-span-2">Photo or video (photos max 10 MB · videos max 100 MB)<input id="media-file" required type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-xl border border-dashed border-[#D9C6A6] p-4 font-normal" /></label>
        <button disabled={busy} className="rounded-xl bg-[#8A2631] px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Uploading…" : "Upload for review"}</button>
      </form>
      {message && <p role="status" className="mt-4 rounded-xl bg-[#FFF2D8] p-3 text-sm text-[#6E4D31]">{message}</p>}
    </section>
    <section>
      <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-black text-[#571E24]"><Images /> Media review queue</h2><button onClick={() => refresh().catch(e => setMessage(e.message))} className="inline-flex items-center gap-2 rounded-lg border border-[#EAD9BD] px-3 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map(item => <article key={item._id} className="rounded-2xl border border-[#EAD9BD] bg-white p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#A66A2B]">{item.year} · {item.type} · {item.provider}</p><h3 className="mt-1 font-extrabold text-[#571E24]">{item.title}</h3><p className="mt-1 text-sm text-[#80675E]">{item.eventName}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{item.published ? "Published" : "Pending"}</span></div>
          {item.type === "image" ? <img src={item.url} alt={item.title} className="mt-4 max-h-56 w-full rounded-xl object-cover" /> : <video src={item.url} controls preload="metadata" className="mt-4 max-h-56 w-full rounded-xl bg-black" />}
          {item.caption && <p className="mt-3 text-sm text-[#80675E]">{item.caption}</p>}
          <div className="mt-4 flex gap-2"><button onClick={() => setPublished(item, true)} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white"><CheckCircle className="h-4 w-4" /> Approve</button><button onClick={() => setPublished(item, false)} disabled={!item.published} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-40"><XCircle className="h-4 w-4" /> Move to pending</button><button onClick={() => void deleteMedia(item)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700"><XCircle className="h-4 w-4" /> Delete permanently</button></div>
        </article>)}
        {items.length === 0 && <p className="rounded-xl border border-dashed border-[#D9C6A6] bg-white p-6 text-sm text-[#80675E]">No media records yet. Upload a photo or video to start the review queue.</p>}
      </div>
    </section>
  </div>;
}
