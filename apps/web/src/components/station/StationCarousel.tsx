"use client";

import { useState, useRef } from "react";
import type { StationWithDJ } from "@ownradio/shared";
import { StationCard } from "./StationCard";

interface StationCarouselProps {
  stations: StationWithDJ[];
  initialIndex?: number;
}

const MIN_SWIPE_PX = 50;

export function StationCarousel({
  stations,
  initialIndex = 0,
}: StationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, stations.length - 1))
  );

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  function goNext() {
    setCurrentIndex((i) => Math.min(i + 1, stations.length - 1));
  }

  function goPrev() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (touchStartX.current === null || touchCurrentX.current === null) return;
    const delta = touchCurrentX.current - touchStartX.current;
    if (delta < -MIN_SWIPE_PX) {
      goNext();
    } else if (delta > MIN_SWIPE_PX) {
      goPrev();
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  }

  if (stations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-white/50">
        No stations available.
      </div>
    );
  }

  return (
    <div
      className="relative h-screen overflow-hidden bg-brand-dark"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dot indicators */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-none">
        {stations.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === currentIndex
                ? "w-4 h-2 bg-brand-pink"
                : "w-2 h-2 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Station cards — render current + adjacent for performance */}
      {stations.map((station, i) => {
        const isVisible = Math.abs(i - currentIndex) <= 1;
        if (!isVisible) return null;

        return (
          <div
            key={station.id}
            className="absolute inset-0 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${(i - currentIndex) * 100}%)`,
              visibility: i === currentIndex ? "visible" : "hidden",
            }}
            aria-hidden={i !== currentIndex}
          >
            <StationCard station={station} isActive={i === currentIndex} />
          </div>
        );
      })}

      {/* Left tap zone — previous */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          aria-label="Previous station"
          className="absolute left-0 top-0 h-full w-[20%] z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
            ←
          </div>
        </button>
      )}

      {/* Right tap zone — next */}
      {currentIndex < stations.length - 1 && (
        <button
          onClick={goNext}
          aria-label="Next station"
          className="absolute right-0 top-0 h-full w-[20%] z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
            →
          </div>
        </button>
      )}
    </div>
  );
}
