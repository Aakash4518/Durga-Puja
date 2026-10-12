"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Megaphone,
  Images,
  ChevronDown,
  Sparkles,
  History,
  CalendarRange,
} from "lucide-react";

type FestivalEvent = {
  _id?: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  year?: number;
  category?: string;
  status?: string;
};

type Announcement = {
  _id?: string;
  title: string;
  message?: string;
  publishedAt?: string;
  year?: number;
  status?: string;
};

type MemoryAlbum = {
  year: number;
  title: string;
  description: string;
  type: string;
};

const thisYear = new Date().getFullYear();

const memoryAlbums: MemoryAlbum[] = [
  {
    year: thisYear - 1,
    title: "Last year's Durga Puja",
    description:
      "Add verified photos, videos and event highlights from the previous year's celebration.",
    type: "Photos & videos",
  },
  {
    year: thisYear - 2,
    title: "Community moments",
    description:
      "Preserve performances, pandal decorations and memorable moments from this year.",
    type: "Community archive",
  },
  {
    year: thisYear - 3,
    title: "Puja memories through the years",
    description:
      "Build a long-term digital record of Laxman Chhapra's festival traditions.",
    type: "Historical memories",
  },
];

function formatDate(value?: string) {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string) {
  if (!value) return "Time to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time to be announced";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function FestivalHub() {
  const [events, setEvents] = useState<FestivalEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [selectedAlbumYear, setSelectedAlbumYear] = useState(thisYear - 1);
  const [dataSource, setDataSource] = useState<
    "loading" | "database" | "error"
  >("loading");

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/events?limit=100", { cache: "no-store" })
        .then(async (response) =>
          response.ok ? response.json() : Promise.reject()
        )
        .catch(() => null),

      fetch("/api/announcements?limit=100", { cache: "no-store" })
        .then(async (response) =>
          response.ok ? response.json() : Promise.reject()
        )
        .catch(() => null),
    ]).then(([eventResult, announcementResult]) => {
      if (!active) return;

      if (!eventResult && !announcementResult) {
        setDataSource("error");
        return;
      }

      const dbEvents: FestivalEvent[] = Array.isArray(eventResult?.data)
        ? eventResult.data
        : [];

      const dbAnnouncements: Announcement[] = Array.isArray(
        announcementResult?.data
      )
        ? announcementResult.data
        : [];

      setEvents(dbEvents);
      setAnnouncements(dbAnnouncements);
      setDataSource("database");
    });

    return () => {
      active = false;
    };
  }, []);

  const years = useMemo(() => {
    const found = new Set<number>([
      thisYear,
      thisYear - 1,
      thisYear - 2,
      thisYear - 3,
    ]);

    events.forEach((event) => {
      const year =
        event.year ??
        (event.startTime
          ? new Date(event.startTime).getFullYear()
          : undefined);

      if (year && Number.isFinite(year)) {
        found.add(year);
      }
    });

    announcements.forEach((item) => {
      if (item.year) {
        found.add(item.year);
      }
    });

    return [...found].sort((a, b) => b - a);
  }, [events, announcements]);

  const visibleEvents = events.filter(
    (event) =>
      (event.year ??
        (event.startTime
          ? new Date(event.startTime).getFullYear()
          : thisYear)) === selectedYear
  );

  const visibleAnnouncements = announcements.filter(
    (item) => !item.year || item.year === selectedYear
  );

  return (
    <>
      <section
        id="events"
        className="scroll-mt-24 mx-auto w-full min-w-0 max-w-7xl px-4 py-9 sm:px-5 sm:py-12 lg:px-8 lg:py-20"
      >
        <div className="grid min-w-0 gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.16em] text-[#A36A2B] sm:tracking-[0.22em]">
              CELEBRATE TOGETHER · YEAR AFTER YEAR
            </p>

            <h2 className="mt-3 max-w-full break-words text-2xl leading-tight font-black tracking-tight text-[#571E24] sm:text-4xl">
              Festival events &amp; updates
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-[#80675E]">
              Browse the programme by year. Organisers can publish the new
              year&apos;s schedule while older years remain part of the
              community record.
            </p>

            <label
              htmlFor="festival-year"
              className="mt-6 block text-sm font-bold text-[#571E24]"
            >
              Select festival year
            </label>

            <div className="relative mt-2 max-w-xs">
              <select
                id="festival-year"
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(Number(event.target.value))
                }
                className="w-full appearance-none rounded-xl border border-[#EAD9BD] bg-white px-4 py-3 pr-10 text-sm font-semibold text-[#571E24] outline-none focus:border-[#8A2631] focus:ring-2 focus:ring-[#8A2631]/15"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                    {year === thisYear
                      ? " · Current year"
                      : year === thisYear - 1
                        ? " · Last year"
                        : ""}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#8A2631]" />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#EAD9BD] bg-white/70 px-3 py-2 text-xs font-medium text-[#80675E]">
              <span
                className={`h-2 w-2 rounded-full ${
                  dataSource === "database"
                    ? "bg-green-600"
                    : "bg-amber-500"
                }`}
              />

              {dataSource === "database"
                ? "Live published data"
                : dataSource === "error"
                  ? "Events could not be loaded. Please try again later."
                  : "Loading published events…"}
            </div>
          </div>

          <div className="min-w-0 w-full">
            <div className="mb-4 flex min-w-0 items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#8A2631]" />
              <h3 className="text-xl font-black text-[#571E24]">
                {selectedYear} programme
              </h3>
            </div>

            {visibleEvents.length ? (
              <div className="flex min-w-0 w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible">
                {visibleEvents.map((event, index) => (
                  <article
                    key={event._id ?? `${event.title}-${index}`}
                    className="w-[min(82vw,340px)] min-w-0 max-w-[340px] shrink-0 snap-start rounded-2xl border border-[#EAD9BD] bg-white/80 p-4 shadow-sm shadow-[#7B1A29]/5 sm:w-auto sm:max-w-none sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-[#F8EBD2] px-3 py-1 text-xs font-bold text-[#8A2631]">
                        {event.category || "Festival event"}
                      </span>

                      <CalendarRange className="h-5 w-5 shrink-0 text-[#B17A35]" />
                    </div>

                    <h4 className="mt-4 text-lg font-black text-[#571E24]">
                      {event.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-[#80675E]">
                      {event.description ||
                        "More details will be shared by the organisers."}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-[#F0E4D0] pt-4 text-xs font-medium text-[#765A52]">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#A36A2B]" />
                        {formatDate(event.startTime)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#A36A2B]" />
                        {formatTime(event.startTime)}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#A36A2B]" />
                        {event.location || "Location to be announced"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D8B56E] bg-white/60 p-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-[#B17A35]" />

                <h4 className="mt-3 font-bold text-[#571E24]">
                  No published events for {selectedYear}
                </h4>

                <p className="mt-2 text-sm text-[#80675E]">
                  Older years stay available in the archive. Add this year&apos;s
                  official schedule when it is confirmed.
                </p>
              </div>
            )}

            <div className="mt-5 min-w-0 rounded-2xl border border-[#EAD9BD] bg-[#FFF3D9] p-3 sm:mt-7 sm:p-5">
              <div className="flex min-w-0 items-center gap-2">
                <Megaphone className="h-5 w-5 shrink-0 text-[#8A2631]" />

                <h3 className="min-w-0 break-words text-base font-black text-[#571E24] sm:text-lg">
                  Announcements · {selectedYear}
                </h3>
              </div>

              {visibleAnnouncements.length ? (
                <div className="mt-4 flex min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible">
                  {visibleAnnouncements.map((item, index) => (
                    <div
                      key={item._id ?? `${item.title}-${index}`}
                      className="w-[min(82vw,340px)] shrink-0 snap-start rounded-xl bg-white/70 p-4 sm:w-auto"
                    >
                      <p className="font-bold text-[#571E24]">{item.title}</p>

                      <p className="mt-1 text-sm leading-6 text-[#80675E]">
                        {item.message ||
                          "Please check with the organisers for details."}
                      </p>

                      <p className="mt-2 text-xs text-[#9A7B63]">
                        {formatDate(item.publishedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#80675E]">
                  No announcements for this year yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="memories"
        className="scroll-mt-24 w-full min-w-0 overflow-hidden bg-[#67151F] text-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-5 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#F5C66F]">
                OUR DIGITAL MEMORY ARCHIVE
              </p>

              <h2 className="mt-3 text-3xl leading-tight font-black sm:text-4xl">
                Every year becomes
                <br />
                part of our story.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#F4E4D7]">
                Keep this year&apos;s moments and previous celebrations
                together. Choose a year to see what should be preserved in the
                village&apos;s digital archive.
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F5C66F]/30 bg-[#FFF2D4]/10 text-[#F5C66F]">
              <Images className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {memoryAlbums.map((album) => (
              <button
                type="button"
                key={album.year}
                onClick={() => {
                  setSelectedAlbumYear(album.year);
                  setSelectedYear(album.year);
                  window.dispatchEvent(
                    new CustomEvent("mela:archive-year", {
                      detail: album.year,
                    })
                  );
                }}
                aria-pressed={selectedAlbumYear === album.year}
                className={`w-[82vw] max-w-[340px] shrink-0 snap-start rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5C66F] sm:w-auto sm:max-w-none sm:p-6 ${
                  selectedAlbumYear === album.year
                    ? "border-[#F5C66F] bg-white/10 ring-1 ring-[#F5C66F]/50"
                    : "border-white/15 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#F5C66F]/15 px-3 py-1 text-xs font-bold text-[#FFDA91]">
                    {album.year}
                  </span>

                  <History className="h-5 w-5 text-[#F5C66F]" />
                </div>

                <h3 className="mt-5 text-lg font-black">{album.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[#E9D3C8]">
                  {album.description}
                </p>

                <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#F5C66F]">
                  <Images className="h-4 w-4" />
                  {album.type}
                </p>

                <span className="mt-4 inline-block text-xs font-bold text-[#FFDA91]">
                  {selectedAlbumYear === album.year
                    ? "Selected year ✓"
                    : "View this year →"}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[#F5C66F]/25 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#F5C66F]">
                  SELECTED ARCHIVE
                </p>

                <h3 className="mt-1 text-xl font-black">
                  {selectedAlbumYear} memories
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedYear(selectedAlbumYear);

                  window.dispatchEvent(
                    new CustomEvent("mela:archive-year", {
                      detail: selectedAlbumYear,
                    })
                  );

                  document
                    .getElementById("gallery")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }}
                className="rounded-full bg-[#F5C66F] px-4 py-2 text-sm font-bold text-[#571E24] transition hover:bg-[#ffda91]"
              >
                View {selectedAlbumYear} memories
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#F4E4D7]">
              No verified photos or videos have been added to this year yet.
              When the organisers upload memories, they should be tagged with{" "}
              {selectedAlbumYear} so the archive stays organised year by year.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-[#F5C66F]/25 bg-white/5 p-5 text-sm leading-6 text-[#F4E4D7]">
            <Sparkles className="mr-2 inline h-4 w-4 text-[#F5C66F]" />
            Archive cards are labelled placeholders. No historical photos,
            videos, or event details are being presented as verified records.
          </div>
        </div>
      </section>
    </>
  );
}