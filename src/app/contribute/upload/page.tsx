
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ContributorUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [eventName, setEventName] = useState("Puja & Aarti");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a photo or video.");
      return;
    }

    const image = file.type.startsWith("image/");
    const video = file.type.startsWith("video/");

    if (!image && !video) {
      setMessage("Choose a valid image or video.");
      return;
    }

    const maxSize = image ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        image
          ? "Photos must be 10 MB or smaller."
          : "Videos must be 100 MB or smaller."
      );
      return;
    }

    setBusy(true);
    setMessage("Preparing Cloudinary upload...");

    try {
      const response = await fetch("/api/admin/upload-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "cloudinary",
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          resourceType: image ? "image" : "video",
        }),
      });

      const instruction = await response.json();

      if (!response.ok) {
        throw new Error(instruction.error || "Could not prepare upload");
      }

      const formData = new FormData();
      formData.append("file", file);

      for (const [key, value] of Object.entries(
        instruction.fields || {}
      )) {
        formData.append(key, String(value));
      }

      const uploadResponse = await fetch(instruction.uploadUrl, {
        method: "POST",
        body: formData,
      });

      const uploaded = await uploadResponse.json();

      if (!uploadResponse.ok || !uploaded.secure_url) {
        throw new Error(
          uploaded.error?.message || "Cloudinary upload failed"
        );
      }

      const mediaResponse = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          caption,
          year,
          eventName,
          type: image ? "image" : "video",
          provider: "cloudinary",
          url: uploaded.secure_url,
          published: false,
        }),
      });

      const saved = await mediaResponse.json();

      if (!mediaResponse.ok) {
        throw new Error(
          saved.error || "Upload succeeded, but saving its record failed"
        );
      }

      setMessage("Submitted successfully! Your upload is awaiting admin review.");
      setTitle("");
      setCaption("");
      setFile(null);

      const input = document.getElementById(
        "contributor-file"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF9EE] px-5 py-12 text-[#321B1A]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#EAD9BD] bg-white p-7">
        <Link href="/" className="text-sm font-bold text-[#8A2631]">
          ← Back to website
        </Link>

        <h1 className="mt-6 text-3xl font-black text-[#571E24]">
          Submit a mela memory
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#80675E]">
          Photos and videos are stored in Cloudinary. An organiser must
          approve your upload before it appears in the public gallery.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Title
            <input
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold">
            Year
            <input
              required
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold">
            Event
            <input
              maxLength={120}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"
            />
          </label>

          <div className="rounded-xl bg-[#FFF2D8] p-3 text-sm">
            <strong>Storage:</strong> Cloudinary
            <p className="mt-1">Images: max 10 MB</p>
            <p>Videos: max 100 MB</p>
          </div>

          <label className="text-sm font-semibold sm:col-span-2">
            Caption
            <textarea
              maxLength={1000}
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold sm:col-span-2">
            Photo or video
            <input
              id="contributor-file"
              required
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-2 block w-full rounded-xl border border-dashed border-[#D9C6A6] p-4 font-normal"
            />
          </label>

          <button
            disabled={busy}
            className="rounded-xl bg-[#8A2631] px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2"
          >
            {busy ? "Uploading..." : "Upload for review"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-4 rounded-xl bg-[#FFF2D8] p-3 text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
