"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Utensils, ShoppingBag, Sparkles, MapPin, Store, SlidersHorizontal, Tag, Phone, Star, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

type Category = "Food & Drinks" | "Shopping" | "Fun & Attractions" | "Other";
type Vendor = {
  _id: string; name: string; category: Category; description?: string; area?: string; location?: string;
  stallNumber?: string; phone?: string; contact?: string; shopImageUrl?: string; imageUrl?: string; status?: string; rating?: number | null; reviewCount?: number;
};
const categories = [
  { label: "All stalls", value: "All", icon: Store },
  { label: "Food & drinks", value: "Food & Drinks", icon: Utensils },
  { label: "Shopping", value: "Shopping", icon: ShoppingBag },
  { label: "Fun & attractions", value: "Fun & Attractions", icon: Sparkles },
] as const;
type CategoryFilter = (typeof categories)[number]["value"];

export default function MelaDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const sliderRef = useRef<HTMLDivElement>(null);
  const moveSlider = (direction: number) => sliderRef.current?.scrollBy({ left: direction * Math.max(280, Math.round(sliderRef.current.clientWidth * 0.82)), behavior: "smooth" });

  useEffect(() => {
    let active = true;
    fetch("/api/stalls?limit=200", { cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load stalls.");
        return body;
      })
      .then(body => { if (active) setVendors(Array.isArray(body.data) ? body.data : []); })
      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : "Could not load stalls."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredVendors = useMemo(() => {
    const search = query.trim().toLowerCase();
    return vendors.filter(vendor => {
      const matchesCategory = category === "All" || vendor.category === category;
      const searchable = [vendor.name, vendor.category, vendor.description, vendor.area, vendor.location, vendor.stallNumber, ...((vendor as Vendor & { tags?: string[] }).tags || [])].join(" ").toLowerCase();
      return matchesCategory && (!search || searchable.includes(search));
    });
  }, [vendors, query, category]);
  const resetFilters = () => { setQuery(""); setCategory("All"); };

  return <section id="stalls" className="scroll-mt-24 border-y border-[#EAD9BD] bg-[#F8EEDC]">
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-5 sm:py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-bold tracking-[0.22em] text-[#A36A2B]">TASTE THE MELA</p><h2 className="mt-3 text-3xl font-black tracking-tight text-[#571E24] sm:text-4xl">Find your favourites.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#80675E]">Explore published food stalls, shops and attractions. Open a vendor profile to see details and leave a category-specific review.</p></div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-[#DFCBA8] bg-white/70 px-4 py-2 text-xs font-semibold text-[#745448]"><Store className="h-4 w-4" /> {filteredVendors.length} {filteredVendors.length === 1 ? "listing" : "listings"}</div>
      </div>
      <div className="mt-5 rounded-2xl border border-[#E8D6B7] bg-[#FFFCF5] p-3 sm:p-5">
        <label htmlFor="mela-search" className="mb-2 block text-sm font-bold text-[#571E24]">What are you looking for?</label>
        <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A18B73]"/><input id="mela-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try a vendor name, food, or shop..." className="w-full rounded-xl border border-[#E5D5BA] bg-white py-3.5 pl-12 pr-4 text-sm text-[#321B1A] outline-none transition placeholder:text-[#A18B73] focus:border-[#9B3540] focus:ring-4 focus:ring-[#9B3540]/10"/></div>
        <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A36A2B]"><SlidersHorizontal className="h-4 w-4"/> Browse by category</div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{categories.map(({label,value,icon:Icon}) => {const selected=category===value;return <button key={value} type="button" onClick={()=>setCategory(value)} aria-pressed={selected} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${selected?"border-[#811D2B] bg-[#811D2B] text-white shadow-sm":"border-[#E5D5BA] bg-white text-[#745448] hover:border-[#BD8B6C] hover:bg-[#FFF5E4]"}`}><Icon className="h-4 w-4"/>{label}</button>;})}</div>
      </div>
      {loadError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not load vendors: {loadError}</p>}
      {loading ? <div className="mt-7 rounded-2xl bg-[#FFFCF5] p-10 text-center text-sm text-[#80675E]">Loading published vendors…</div> : filteredVendors.length ? <><div className="mt-5 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#80675E]">Swipe to see shops</p><div className="hidden gap-2 sm:flex"><button type="button" onClick={()=>moveSlider(-1)} aria-label="Previous vendors" className="rounded-full border border-[#E8D6B7] bg-white p-2 text-[#8A2631]"><ChevronLeft className="h-5 w-5"/></button><button type="button" onClick={()=>moveSlider(1)} aria-label="Next vendors" className="rounded-full border border-[#E8D6B7] bg-white p-2 text-[#8A2631]"><ChevronRight className="h-5 w-5"/></button></div></div><div ref={sliderRef} className="mt-3 flex min-w-0 w-full max-w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:thin]">{filteredVendors.map((vendor,index)=>{
        const image = vendor.shopImageUrl || vendor.imageUrl;
        const isFood = vendor.category === "Food & Drinks";
        const Icon = vendor.category === "Shopping" ? ShoppingBag : vendor.category === "Fun & Attractions" ? Sparkles : Utensils;
        return <article key={vendor._id} className="group w-[min(84vw,360px)] min-w-0 max-w-[360px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#E8D6B7] bg-[#FFFCF5] transition duration-200 hover:-translate-y-1 hover:border-[#D6B477] hover:shadow-xl hover:shadow-[#571E24]/[0.07]">
          <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100/70 to-[#FFF9EE]">{image ? <img src={image} alt={`${vendor.name} shop`} className="h-full w-full object-cover" loading="lazy"/> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7EBD7] text-[#8A2631]"><Icon className="h-7 w-7"/></div>}<span className="absolute right-4 top-4 rounded-full border border-[#E8D6B7] bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8A6A4A]">{vendor.stallNumber ? `Stall ${vendor.stallNumber}` : "Verified listing"}</span><span className="absolute bottom-2 right-4 text-4xl font-black text-[#811D2B]/20">{String(index+1).padStart(2,"0")}</span></div>
          <div className="p-4 sm:p-5"><p className="text-[10px] font-bold tracking-[0.18em] text-[#A36A2B]">{vendor.category.toUpperCase()}</p><h3 className="mt-2 text-xl font-bold text-[#571E24]">{vendor.name}</h3><p className="mt-2 min-h-[48px] text-sm leading-6 text-[#80675E]">{vendor.description || "Visit this local mela vendor."}</p><div className="mt-4 flex items-start gap-2 border-t border-[#F0E4D0] pt-4 text-xs font-medium text-[#8B7464]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9B3540]"/><span>{vendor.area || vendor.location || "Address to be added"}</span></div>{(vendor.phone || vendor.contact) && <a href={`tel:${vendor.phone || vendor.contact}`} className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#8A2631]"><Phone className="h-4 w-4"/>{vendor.phone || vendor.contact}</a>}<div className="mt-5 flex items-center justify-between border-t border-[#F0E4D0] pt-4"><span className="inline-flex items-center gap-1 text-sm font-bold text-[#6E4B25]"><Star className="h-4 w-4 fill-amber-400 text-amber-500"/> {typeof vendor.rating === "number" ? vendor.rating.toFixed(1) : "New"}<span className="text-xs font-medium text-[#8B7464]">{vendor.reviewCount ? `(${vendor.reviewCount} ${vendor.reviewCount === 1 ? "review" : "reviews"})` : " · No reviews yet"}</span></span><Link href={`/vendors/${vendor._id}`} className="inline-flex items-center gap-1 text-sm font-bold text-[#8A2631] hover:text-[#571E24]">Details & reviews <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></Link></div></div>
        </article>;
      })}</div></> : <div className="mt-5 rounded-2xl border border-dashed border-[#D9C29D] bg-[#FFFCF5] px-5 py-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7EBD7] text-[#8A2631]"><Search className="h-6 w-6"/></div><h3 className="mt-4 text-lg font-bold text-[#571E24]">{vendors.length===0?"Vendor listings are coming soon":"No matching stalls found"}</h3><p className="mt-2 text-sm text-[#80675E]">{vendors.length===0?"Published vendor records will appear here automatically. In the admin dashboard, set a stall's status to Published.":"Try another search term or choose a different category."}</p>{vendors.length>0&&<button onClick={resetFilters} className="mt-5 rounded-full bg-[#811D2B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#67151F]">Clear search and filters</button>}</div>}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#E8D6B7] bg-white/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-bold text-[#571E24]">Know a mela vendor?</p><p className="mt-1 text-sm leading-6 text-[#80675E]">Vendor profiles show contact details and community reviews once published.</p></div><a href="#events" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#8A2631] hover:text-[#571E24]">See festival updates <ArrowUpRight className="h-4 w-4"/></a></div>
    </div>
  </section>;
}
