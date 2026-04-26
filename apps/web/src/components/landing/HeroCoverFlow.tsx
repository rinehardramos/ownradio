"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import type { StationWithDJ } from "@ownradio/shared";
import { getStationPlaceholder } from "@/lib/placeholders";

interface HeroCoverFlowProps {
  stations: StationWithDJ[];
  initialIndex?: number;
}

const MIN_SWIPE_PX = 50;

function getCoverStyle(offset: number): React.CSSProperties {
  if (offset === 0) {
    return {
      transform: "translateX(0) scale(1.15)",
      opacity: 1,
      zIndex: 10,
      boxShadow: "0 12px 48px rgba(255,45,120,0.3), 0 4px 20px rgba(0,0,0,0.6)",
    };
  }

  const sign = offset > 0 ? 1 : -1;
  const abs = Math.abs(offset);
  const tx = sign * (160 + (abs - 1) * 120);
  const rotY = -sign * 45;
  const scale = Math.max(0.5, 0.8 - (abs - 1) * 0.15);
  const opacity = Math.max(0.2, 0.7 - (abs - 1) * 0.2);

  return {
    transform: `translateX(${tx}px) perspective(800px) rotateY(${rotY}deg) scale(${scale})`,
    opacity,
    zIndex: 10 - abs,
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  };
}

export function HeroCoverFlow({ stations, initialIndex = 0 }: HeroCoverFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);

  const navigate = useCallback(
    (delta: number) => {
      setCurrentIndex((i) => Math.max(0, Math.min(stations.length - 1, i + delta)));
    },
    [stations.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > MIN_SWIPE_PX) navigate(dx < 0 ? 1 : -1);
  };

  if (stations.length === 0) return null;

  const active = stations[currentIndex];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#0f0f1a", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Cover Flow area */}
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ height: "340px", perspective: "1200px" }}
      >
        {/* Nav arrows (hidden on mobile) */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 z-20 hidden sm:flex items-center justify-center"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            cursor: "pointer",
          }}
          aria-label="Previous station"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={() => navigate(1)}
          className="absolute right-6 z-20 hidden sm:flex items-center justify-center"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            cursor: "pointer",
          }}
          aria-label="Next station"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Covers */}
        {stations.map((station, i) => {
          const offset = i - currentIndex;
          if (Math.abs(offset) > 3) return null;

          const style = getCoverStyle(offset);
          const img = station.artworkUrl || getStationPlaceholder(station.genre);

          return (
            <div
              key={station.id}
              onClick={() => setCurrentIndex(i)}
              className="absolute cursor-pointer"
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "all 500ms cubic-bezier(.4,0,.2,1)",
                backfaceVisibility: "hidden",
                ...style,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={station.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                }}
              />

              {/* LIVE badge */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  background: "#ff2d78",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#fff",
                }}
              >
                <span
                  className="dot-live"
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "#22c55e",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                />
                LIVE
              </div>

              {/* Station info overlay */}
              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {station.genre}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {station.name}
                </div>
                {station.dj && (
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                    {station.dj.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Station info panel */}
      <div className="relative z-10 flex flex-col items-center px-4 pb-10">
        <h2
          className="text-center text-3xl font-black sm:text-4xl"
          style={{
            background: "linear-gradient(135deg, #ff2d78, #ff6b9d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {active.name}
        </h2>

        {active.description && (
          <p className="mt-2 text-center text-sm text-white/50">{active.description}</p>
        )}

        {active.currentSong && (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
          >
            <span className="text-xs text-white/40">Now Playing</span>
            <span className="text-sm font-medium text-white">{active.currentSong.title}</span>
            <span className="text-xs text-white/40">—</span>
            <span className="text-sm text-white/70">{active.currentSong.artist}</span>
          </div>
        )}

        <Link
          href={`/station/${active.slug}`}
          className="card-hover mt-6 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
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

        <div className="mt-6 flex gap-2">
          {stations.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to station ${i + 1}`}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                transition: "all 300ms ease",
                background: i === currentIndex ? "#ff2d78" : "rgba(255,255,255,0.2)",
                boxShadow: i === currentIndex ? "0 0 8px rgba(255,45,120,0.5)" : "none",
              }}
            />
          ))}
        </div>

        <p className="mt-4 text-xs tracking-wider text-white/20 sm:hidden">
          SWIPE TO BROWSE
        </p>
      </div>
    </section>
  );
}
