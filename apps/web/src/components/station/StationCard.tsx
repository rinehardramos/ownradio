"use client";

import Image from "next/image";
import type { StationWithDJ } from "@ownradio/shared";
import { useStation } from "@/hooks/useStation";
import { useAuth } from "@/hooks/useAuth";
import { AudioControls } from "./AudioControls";
import { ReactionBar } from "./ReactionBar";
import { LiveChat } from "./LiveChat";
import { DJSection } from "./DJSection";

interface StationCardProps {
  station: StationWithDJ;
  isActive: boolean;
}

const GENRE_GRADIENTS: Record<string, string> = {
  Rock: "from-red-900 via-orange-900 to-brand-dark",
  "Hip-Hop / R&B": "from-purple-900 via-indigo-900 to-brand-dark",
  "Lo-Fi / Ambient": "from-blue-900 via-teal-900 to-brand-dark",
  OPM: "from-yellow-900 via-orange-900 to-brand-dark",
};

function getGradient(genre: string): string {
  return (
    GENRE_GRADIENTS[genre] ?? "from-brand-dark-card via-brand-dark to-brand-dark"
  );
}

export function StationCard({ station, isActive }: StationCardProps) {
  const {
    reactions,
    messages,
    listenerCount,
    activeReactions,
    currentSong,
    sendReaction,
    sendMessage,
  } = useStation(station);

  const { user } = useAuth();

  const gradient = getGradient(station.genre);

  function handleSend(content: string) {
    if (!user) return;
    sendMessage(content, user);
  }

  return (
    <div className="h-full flex flex-col bg-brand-dark overflow-y-auto">
      {/* Hero section */}
      <div
        className={`bg-gradient-to-b ${gradient} px-5 pt-10 pb-6 flex flex-col gap-3 flex-shrink-0`}
      >
        {/* Genre tag */}
        <span className="inline-block self-start px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wide text-white/70">
          {station.genre}
        </span>

        {/* Station name */}
        <h1 className="text-4xl font-extrabold text-white leading-tight">
          {station.name}
        </h1>

        {/* Current song */}
        {currentSong ? (
          <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3 backdrop-blur-sm">
            {currentSong.albumCoverUrl ? (
              <Image
                src={currentSong.albumCoverUrl}
                alt={currentSong.title}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-brand-pink/20 flex items-center justify-center text-2xl flex-shrink-0">
                🎵
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {currentSong.title}
              </p>
              <p className="text-white/60 text-xs truncate">{currentSong.artist}</p>
            </div>
            {/* Animated playing indicator */}
            {isActive && (
              <div className="ml-auto flex items-end gap-0.5 h-4 flex-shrink-0">
                <span className="w-1 bg-brand-pink rounded-sm animate-bounce" style={{ height: "40%", animationDelay: "0ms" }} />
                <span className="w-1 bg-brand-pink rounded-sm animate-bounce" style={{ height: "100%", animationDelay: "150ms" }} />
                <span className="w-1 bg-brand-pink rounded-sm animate-bounce" style={{ height: "60%", animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
              📻
            </div>
            <p className="text-white/50 text-sm">Loading track info...</p>
          </div>
        )}
      </div>

      {/* Audio controls */}
      <div className="bg-brand-dark-card border-b border-brand-dark-border flex-shrink-0">
        <AudioControls streamUrl={station.streamUrl} isActive={isActive} />
      </div>

      {/* Reaction bar */}
      <div className="bg-brand-dark-card border-b border-brand-dark-border flex-shrink-0">
        <ReactionBar
          reactions={reactions}
          activeReactions={activeReactions}
          onReact={sendReaction}
        />
      </div>

      {/* DJ section */}
      {station.dj && (
        <div className="bg-brand-dark-card border-b border-brand-dark-border flex-shrink-0">
          <DJSection dj={station.dj} listenerCount={listenerCount} />
        </div>
      )}

      {/* Live chat */}
      <div className="flex-1 px-4 py-4">
        <LiveChat messages={messages} onSend={handleSend} user={user} />
      </div>
    </div>
  );
}
