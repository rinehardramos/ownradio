"use client";

import { useState, useRef } from "react";
import type { StationWithDJ } from "@ownradio/shared";
import { useStation } from "@/hooks/useStation";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { ChatPanel } from "./ChatPanel";
import { StationCard } from "./StationCard";
import type { AudioControlsHandle } from "./AudioControls";

interface StationCarouselProps {
  stations: StationWithDJ[];
  initialIndex?: number;
}

const MIN_SWIPE_PX = 50;

// Inner component — only rendered when stations.length > 0
function StationCarouselInner({
  stations,
  initialIndex,
}: {
  stations: [StationWithDJ, ...StationWithDJ[]];
  initialIndex: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, stations.length - 1))
  );

  const currentStation = stations[currentIndex] ?? stations[0];
  const audioRef = useRef<AudioControlsHandle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const { user } = useAuth();

  const {
    currentSong,
    songResolved,
    activeReaction,
    listenerCount,
    messages,
    streamUrl,
    activeDj,
    sendReaction,
    sendMessage,
  } = useStation(currentStation);

  // === SWIPE / TOUCH GESTURE HANDLERS (preserved from original) ===
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
  // === END SWIPE HANDLERS ===

  return (
    <AppShell
      stations={stations}
      activeStationId={currentStation.id}
      onStationChange={setCurrentIndex}
      stationCount={stations.length}
      currentIndex={currentIndex}
      onDotClick={setCurrentIndex}
      currentSong={
        currentSong
          ? { title: currentSong.title, artist: currentSong.artist }
          : null
      }
      currentStation={currentStation}
      isPlaying={isPlaying}
      volume={volume}
      listenerCount={listenerCount}
      onTogglePlay={() => audioRef.current?.togglePlay()}
      onVolumeChange={(v) => {
        setVolume(v);
        audioRef.current?.setVolume(v);
      }}
      chatContent={
        <ChatPanel
          messages={messages}
          user={user}
          onSend={sendMessage}
          onlineCount={listenerCount}
          height="100%"
        />
      }
    >
      {/* Station cards carousel with swipe support */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {stations.map((station, i) => (
          <div
            key={station.id}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${(i - currentIndex) * 100}%)`,
              transition: "transform 300ms cubic-bezier(.4,0,.2,1)",
            }}
            aria-hidden={i !== currentIndex}
          >
            <StationCard
              station={station}
              isActive={i === currentIndex}
              currentSong={i === currentIndex ? currentSong : null}
              songResolved={i === currentIndex ? songResolved : true}
              activeReaction={i === currentIndex ? activeReaction : null}
              streamUrl={i === currentIndex ? (streamUrl ?? null) : null}
              activeDj={i === currentIndex ? activeDj : null}
              listenerCount={i === currentIndex ? listenerCount : 0}
              onReact={sendReaction}
              onPlayStateChange={setIsPlaying}
              onVolumeChange={setVolume}
              audioRef={i === currentIndex ? audioRef : undefined}
            />
          </div>
        ))}

        {/* Left tap zone — previous */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            aria-label="Previous station"
            className="absolute left-0 top-1/4 h-1/2 w-16 z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
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
            className="absolute right-0 top-1/4 h-1/2 w-16 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              →
            </div>
          </button>
        )}
      </div>
    </AppShell>
  );
}

export function StationCarousel({
  stations,
  initialIndex = 0,
}: StationCarouselProps) {
  if (stations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-white/50">
        No stations available.
      </div>
    );
  }

  return (
    <StationCarouselInner
      stations={stations as [StationWithDJ, ...StationWithDJ[]]}
      initialIndex={initialIndex}
    />
  );
}
