import Link from "next/link";
import type { StationWithDJ } from "@ownradio/shared";
import { getStationPlaceholder, getDJPlaceholder } from "@/lib/placeholders";

interface HeroStationProps {
  station: StationWithDJ;
  stationCount: number;
  listenerCount: number;
  djCount: number;
  liveCount: number;
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function HeroStation({
  station,
  stationCount,
  listenerCount,
  djCount,
  liveCount,
}: HeroStationProps) {
  const bgImage = station.artworkUrl || getStationPlaceholder(station.genre);

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "420px" }}>
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "brightness(0.3) saturate(1.3) blur(2px)", transform: "scale(1.05)" }}
      />

      {/* Gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,15,26,0.6) 0%, rgba(15,15,26,0.85) 70%, rgba(15,15,26,1) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-12 pb-10 sm:px-8">
        {/* LIVE badge */}
        {station.isLive && (
          <div className="mb-6 flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: "var(--pink)" }}
            >
              <span
                className="dot-live inline-block rounded-full"
                style={{ width: "6px", height: "6px", background: "#22c55e" }}
              />
              LIVE NOW
            </span>
            {station.listenerCount > 0 && (
              <span className="text-xs text-white/60">
                {fmt(station.listenerCount)} listening
              </span>
            )}
          </div>
        )}

        {/* Station name */}
        <h1
          className="text-center font-sans text-5xl font-extrabold uppercase tracking-widest sm:text-6xl"
          style={{
            background: "linear-gradient(135deg, #ff2d78 0%, #ff6b9d 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {station.name}
        </h1>

        {/* Description */}
        {station.description && (
          <p className="mt-3 text-center text-lg text-white/70">{station.description}</p>
        )}

        {/* DJ + Now Playing */}
        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          {/* DJ */}
          {station.dj && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getDJPlaceholder(station.dj.id, station.dj.avatarUrl)}
                alt={station.dj.name}
                className="rounded-full"
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              />
              <div>
                <div className="text-sm font-semibold text-white">{station.dj.name}</div>
                <div className="text-xs text-white/50">DJ</div>
              </div>
            </div>
          )}

          {/* Now playing */}
          {station.currentSong && (
            <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
              <span className="text-xs text-white/50">Now Playing</span>
              <span className="text-sm font-medium text-white">
                {station.currentSong.title}
              </span>
              <span className="text-xs text-white/40">—</span>
              <span className="text-sm text-white/70">{station.currentSong.artist}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/station/${station.slug}`}
          className="card-hover mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #ff2d78 0%, #ff6b9d 100%)",
            boxShadow: "0 4px 24px rgba(255,45,120,0.3)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
          Listen Now
        </Link>

        {/* Stats bar */}
        <div className="mt-10 flex justify-center gap-8 flex-wrap">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--pink)" }}>
              {stationCount}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">Stations</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "#22c55e" }}>
              {liveCount}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">Live Now</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--pink)" }}>
              {fmt(listenerCount)}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">Listeners</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--pink)" }}>
              {djCount}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">DJs</span>
          </div>
        </div>
      </div>
    </section>
  );
}
