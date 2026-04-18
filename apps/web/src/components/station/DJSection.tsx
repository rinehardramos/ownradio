"use client";

import { useState } from "react";
import Image from "next/image";
import type { DJ } from "@ownradio/shared";
import { DJBioModal } from "./DJBioModal";

interface DJSectionProps {
  dj: DJ;
  listenerCount: number;
}

export function DJSection({ dj, listenerCount }: DJSectionProps) {
  const [isBioOpen, setIsBioOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: avatar + name + listeners */}
        <button
          onClick={() => setIsBioOpen(true)}
          aria-label={`View ${dj.name}'s bio`}
          className="flex items-center gap-3 min-w-0"
        >
          {dj.avatarUrl ? (
            <Image
              src={dj.avatarUrl}
              alt={dj.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-brand-pink/40 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center text-lg flex-shrink-0">
              🎧
            </div>
          )}
          <div className="text-left min-w-0">
            <p className="text-white font-semibold text-sm truncate">{dj.name}</p>
            <p className="text-white/50 text-xs">👥 {listenerCount} listening</p>
          </div>
        </button>

        {/* Right: pill buttons */}
        <div className="flex items-center gap-2">
          {(["Playlist", "Top 10", "Fans"] as const).map((label) => (
            <button
              key={label}
              aria-label={label}
              className="px-3 py-1 rounded-full border border-brand-dark-border text-xs text-white/60 hover:border-brand-pink/50 hover:text-white/80 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <DJBioModal
        dj={dj}
        isOpen={isBioOpen}
        onClose={() => setIsBioOpen(false)}
      />
    </>
  );
}
