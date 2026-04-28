"use client";

import { useRef, useState, useEffect } from "react";
import type {
  StationWithDJ,
  ReactionType,
  Song,
  DjSwitchPayload,
  Program,
  DjFloatingEvent,
} from "@ownradio/shared";
import { AudioControls, type AudioControlsHandle } from "./AudioControls";
import { getSocket } from "@/lib/socket";
import { ReactionBar } from "./ReactionBar";
import { PlaylistModal } from "./PlaylistModal";
import { TopSongsModal } from "./TopSongsModal";
import { FansModal } from "./FansModal";
import { getStationPlaceholder, getDJPlaceholder, getSongPlaceholder } from "@/lib/placeholders";
import { Mic2, ChevronDown, ChevronUp } from 'lucide-react';
import { PastShowsList } from './PastShowsList';

interface StationCardProps {
  station: StationWithDJ;
  isActive: boolean;
  currentSong: Song | null;
  songResolved?: boolean;
  autoPlay?: boolean;
  activeReaction: ReactionType | null;
  streamUrl: string | null;
  activeDj: DjSwitchPayload | null;
  listenerCount: number;
  djEvents?: DjFloatingEvent[] | null;
  onReact: (type: ReactionType) => void;
  onPlayStateChange: (playing: boolean) => void;
  onVolumeChange: (volume: number) => void;
  audioRef?: React.RefObject<AudioControlsHandle | null>;
}

type ModalType = "playlist" | "top10" | "fans" | null;

export function StationCard({
  station,
  isActive,
  currentSong,
  songResolved = true,
  autoPlay = false,
  activeReaction,
  streamUrl,
  activeDj,
  listenerCount,
  djEvents,
  onReact,
  onPlayStateChange,
  onVolumeChange,
  audioRef,
}: StationCardProps) {
  const internalRef = useRef<AudioControlsHandle | null>(null);
  const resolvedRef = audioRef ?? internalRef;

  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [showPastShows, setShowPastShows] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [programStreamUrl, setProgramStreamUrl] = useState<string | null>(null);

  const heroImg = station.artworkUrl || getStationPlaceholder(station.genre);
  const djName = activeDj?.name ?? station.dj?.name ?? null;

  useEffect(() => {
    if (!showPastShows) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stations/${station.slug}/programs`)
      .then((r) => r.json())
      .then((data: Program[]) => setPrograms(data))
      .catch(() => setPrograms([]));
  }, [showPastShows, station.slug]);

  function handleProgramPlay(prog: Program) {
    if (activeProgram?.id === prog.id) {
      setActiveProgram(null);
      setProgramStreamUrl(null);
    } else {
      setActiveProgram(prog);
      setProgramStreamUrl(prog.playbackUrl);
    }
  }

  // "mock" is the sentinel for placeholder-only stations with no real stream.
  // Empty string means coming soon. Both should not attempt HLS playback.
  const rawStreamUrl = streamUrl ?? station.streamUrl;
  const isPlaceholderStream =
    !rawStreamUrl || rawStreamUrl === "mock" || rawStreamUrl.startsWith("https://placeholder.example");
  const effectiveStreamUrl = programStreamUrl
    ? programStreamUrl
    : isPlaceholderStream ? null : rawStreamUrl;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100%" }}>
      {/* Hero background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.5) saturate(1.2)",
        }}
      />
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, var(--bg-primary) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Top row: genre badge + LIVE indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {station.genre}
          </span>
          {station.isLive && (
            <span
              className="live-badge"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                background: "rgba(255,45,120,0.2)",
                border: "1px solid rgba(255,45,120,0.4)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--pink)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <span
                className="dot-live"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--pink)",
                }}
              />
              LIVE
            </span>
          )}
        </div>

        {/* Station name */}
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 900,
            color: "#fff",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {station.name}
        </h1>

        {/* Glassmorphic now-playing card */}
        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Album art / icon */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,45,120,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getSongPlaceholder(currentSong?.id, currentSong?.albumCoverUrl)}
              alt={currentSong?.title ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentSong
                ? currentSong.title
                : songResolved
                  ? "No track playing"
                  : "Loading track info..."}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentSong ? currentSong.artist : ""}
            </p>
          </div>

          {/* Equalizer bars */}
          {isActive && currentSong && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "3px",
                height: "20px",
                flexShrink: 0,
              }}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="playing-bar"
                  style={{
                    width: "3px",
                    background: "var(--pink)",
                    borderRadius: "2px",
                    display: "block",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reaction bar */}
        <ReactionBar
          activeReaction={activeReaction}
          onReact={onReact}
          orientation="horizontal"
        />

        {/* Audio controls — only render for active card to stop playback on swipe */}
        {isActive && effectiveStreamUrl ? (
          <AudioControls
            ref={resolvedRef}
            streamUrl={effectiveStreamUrl}
            stationSlug={station.slug}
            autoPlay={autoPlay}
            onPlayStateChange={onPlayStateChange}
            onVolumeChange={onVolumeChange}
            djEvents={djEvents ?? undefined}
            onSongDetected={(artist, title) => {
              const socket = getSocket();
              socket.emit('client_now_playing', { artist, title });
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              color: "rgba(255,255,255,0.35)",
              fontSize: "13px",
            }}
          >
            <Mic2 size={18} strokeWidth={1.75} color="rgba(255,255,255,0.35)" />
            <span>Coming Soon — stream not yet available</span>
          </div>
        )}

        {/* DJ card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "1px solid rgba(255,45,120,0.4)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getDJPlaceholder(station.dj?.id ?? activeDj?.djId, station.dj?.avatarUrl)}
                alt={djName ?? "DJ"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {djName ?? "Unknown DJ"}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {listenerCount.toLocaleString()} listening
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {(
              [
                { label: "Playlist", modal: "playlist" as ModalType },
                { label: "Top 10", modal: "top10" as ModalType },
                { label: "Fans", modal: "fans" as ModalType },
              ] as const
            ).map(({ label, modal }) => (
              <button
                key={label}
                onClick={() => setOpenModal(modal)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  border: "1px solid var(--border-medium)",
                  background: "none",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  transition: "border-color 150ms, color 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,45,120,0.5)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.9)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--border-medium)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.6)";
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Past Shows */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <button
            onClick={() => setShowPastShows((v) => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}
          >
            Past Shows
            {showPastShows
              ? <ChevronUp size={14} strokeWidth={2} color="rgba(255,255,255,0.4)" />
              : <ChevronDown size={14} strokeWidth={2} color="rgba(255,255,255,0.4)" />
            }
          </button>
          {showPastShows && (
            <div style={{ padding: '0 16px 12px' }}>
              <PastShowsList programs={programs} onPlay={handleProgramPlay} activeProgram={activeProgram} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {openModal === "playlist" && (
        <PlaylistModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === "top10" && (
        <TopSongsModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === "fans" && (
        <FansModal
          listenerCount={listenerCount}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}
