import {
  ArrowDownRight, ArrowRight, CalendarDays, Clock3, Heart, Images, MapPin,
  Sparkles, Utensils
} from "lucide-react";
import MelaDirectory from "./MelaDirectory";
import FestivalHub from "./FestivalHub";
import MemoryGallery from "./MemoryGallery";

const highlights = [
  { icon: CalendarDays, title: "Puja & Aarti", description: "Check the festival programme and timings.", href: "#events" },
  { icon: Utensils, title: "Food & Stalls", description: "Find food, shops and local favourites.", href: "#stalls" },
  { icon: Images, title: "Festival Memories", description: "Explore photographs and videos from the mela.", href: "#memories" },
];
export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF9EE] text-[#321B1A]">
      <div className="bg-[#67151F] px-4 py-2 text-center text-xs font-medium tracking-wide text-[#FFE7B0] sm:text-sm">
        <Sparkles className="mr-2 inline-block h-3.5 w-3.5" /> Celebrating faith, tradition and our village community
      </div>
      <header className="sticky top-0 z-50 border-b border-[#E9D7B9] bg-[#FFF9EE]/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
          <a href="#home" className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center sm:h-11 sm:w-11 justify-center rounded-full bg-[#811D2B] text-xl text-[#FFD78A] shadow-sm">ॐ</div>
            <div><p className="text-[11px] font-black tracking-tight text-[#741925] sm:text-base">LAXMAN CHHAPRA</p><p className="text-[10px] font-semibold tracking-[0.2em] text-[#9C713B] sm:text-xs">DURGA PUJA & MELA</p></div>
          </a>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#634443] md:flex">
            <a className="hover:text-[#A52232]" href="#home">Home</a><a className="hover:text-[#A52232]" href="#stalls">Explore Mela</a><a className="hover:text-[#A52232]" href="#events">Events</a><a className="hover:text-[#A52232]" href="#memories">Memories</a>
          </div>
          <a href="#events" className="rounded-full bg-[#8B1E2D] px-3 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#67151F] sm:px-5 sm:text-sm">Explore Festival ↗</a>
        </nav>
      </header>
      <section id="home" className="relative isolate overflow-hidden bg-[#741925] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_40%,rgba(240,153,55,0.24),transparent_40%),radial-gradient(ellipse_at_10%_90%,rgba(164,37,51,0.8),transparent_45%)]" />
        <div className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full border border-[#E8BB69]/20 sm:right-0 sm:top-0" />
        <div className="absolute -right-12 -top-12 -z-10 h-72 w-72 rounded-full border border-[#E8BB69]/20 sm:right-12 sm:top-12" />
        <div className="mx-auto grid max-w-7xl items-center gap-7 px-4 py-10 sm:gap-10 sm:px-5 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F5CF86]/30 bg-[#FFF2D4]/10 px-4 py-2 text-xs font-semibold text-[#FFE0A1] sm:text-sm"><Sparkles className="h-4 w-4" /> A celebration of our traditions</div>
            <p className="mb-4 text-sm font-semibold tracking-[0.28em] text-[#F3C46C] sm:text-base">जय माता दी</p>
            <h1 className="max-w-2xl text-4xl leading-[1.12] font-black tracking-tight sm:text-5xl lg:text-7xl">Where devotion<br />meets <span className="text-[#F6CB77]">celebration.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#F4E4D7] sm:text-lg sm:leading-8">Discover the colours, flavours, traditions and beautiful memories of Durga Puja in Laxman Chhapra, Bairia, Ballia.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#stalls" className="inline-flex items-center gap-2 rounded-full bg-[#F5C66F] px-6 py-3.5 text-sm font-bold text-[#4B2020] transition hover:bg-[#FFDA91]">Explore the Mela <ArrowRight className="h-4 w-4" /></a>
              <a href="#memories" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Our Memories <Images className="h-4 w-4" /></a>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-[#F3DCC7]"><MapPin className="h-5 w-5 shrink-0 text-[#F5C66F]" /> Laxman Chhapra, Bairia, Ballia, Uttar Pradesh</div>
          </div>
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center py-5">
            <div className="absolute h-64 w-64 rounded-full bg-[#F5B64F]/10 blur-3xl sm:h-80 sm:w-80" />
            <div className="relative flex aspect-square w-full max-w-[360px] items-center justify-center rounded-full border border-[#F4CF88]/30 bg-[radial-gradient(circle,#9D3035_0%,#7B1A29_55%,#57121F_100%)] shadow-[0_0_90px_rgba(245,185,88,0.12)]">
              <div className="absolute inset-4 rounded-full border border-dashed border-[#F6D79D]/40 sm:inset-6" /><div className="absolute inset-10 rounded-full border border-[#F6D79D]/30 sm:inset-12" />
              <div className="absolute top-8 left-1/2 -translate-x-1/2 text-2xl text-[#F8D58D]">✦</div><div className="absolute top-1/2 left-5 -translate-y-1/2 text-xl text-[#F8D58D]">✧</div><div className="absolute top-1/2 right-5 -translate-y-1/2 text-xl text-[#F8D58D]">✧</div>
              <div className="relative z-10 text-center"><div className="mb-3 text-7xl drop-shadow-lg sm:text-8xl">🪔</div><p className="text-xs font-semibold tracking-[0.3em] text-[#F7D58F]">OUR FESTIVAL</p><p className="mt-3 text-3xl font-black text-[#FFF0C7] sm:text-4xl">माँ दुर्गा</p><p className="mt-2 text-sm text-[#F5DCC8]">Faith · Unity · Tradition</p></div>
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-lg tracking-[0.5em] text-[#F8D58D]">✦ ✧ ✦</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/10"><div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-4 text-sm text-[#F5DDC7] lg:px-8"><Heart className="h-4 w-4 fill-[#F5C66F] text-[#F5C66F]" /> Made with devotion for our village and community</div></div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-5 sm:py-12 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[0.22em] text-[#A36A2B]">EXPLORE THE CELEBRATION</p><h2 className="mt-3 text-3xl font-black tracking-tight text-[#571E24] sm:text-4xl">Everything in one place.</h2></div><p className="max-w-md text-sm leading-6 text-[#7C625A]">Your guide to the mela, its programmes, local shops and the memories we share.</p></div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible">{highlights.map(({ icon: Icon, title, description, href }) => <a key={title} href={href} className="group w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl border border-[#EAD9BD] bg-white/70 p-4 sm:w-auto sm:max-w-none sm:p-6 transition hover:-translate-y-1 hover:border-[#D8B56E] hover:shadow-lg hover:shadow-[#7B1A29]/5"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EBD2] text-[#8A2631] transition group-hover:bg-[#8A2631] group-hover:text-white"><Icon className="h-6 w-6" /></div><h3 className="text-lg font-bold text-[#571E24]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#80675E]">{description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#8A2631]">Explore <ArrowRight className="h-4 w-4" /></span></a>)}</div>
      </section>
      <MelaDirectory />
      <FestivalHub />
      <MemoryGallery />
      <footer className="bg-[#FFF9EE]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="font-black tracking-wide text-[#741925]">LAXMAN CHHAPRA MELA</p><p className="mt-1 text-xs text-[#80675E]">Laxman Chhapra, Bairia, Ballia, Uttar Pradesh</p></div><a href="#home" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8A2631] hover:text-[#571E24]">Back to top <ArrowRight className="h-4 w-4 -rotate-90" /></a></div><div className="border-t border-[#EAD9BD] px-5 py-4 text-center text-xs text-[#8A7568]">Made with devotion for our village. Built for the community.</div></footer>
    </main>
  );
}
