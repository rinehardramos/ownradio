"use client";

import Image from "next/image";
import type { DJ } from "@ownradio/shared";

interface DJBioModalProps {
  dj: DJ;
  isOpen: boolean;
  onClose: () => void;
}

export function DJBioModal({ dj, isOpen, onClose }: DJBioModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div className="relative w-full bg-brand-dark-card rounded-t-2xl px-6 pt-6 pb-10 shadow-2xl animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close DJ bio"
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* DJ avatar */}
        <div className="flex flex-col items-center gap-3 mb-4">
          {dj.avatarUrl ? (
            <Image
              src={dj.avatarUrl}
              alt={dj.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-brand-pink"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-pink/20 border-2 border-brand-pink flex items-center justify-center text-3xl">
              🎧
            </div>
          )}
          <h2 className="text-xl font-bold text-white">{dj.name}</h2>
        </div>

        {/* Bio */}
        <p className="text-white/70 text-sm leading-relaxed text-center mb-4">
          {dj.bio}
        </p>
      </div>
    </div>
  );
}
