"use client";

import type { ReactionCounts, ReactionType } from "@ownradio/shared";

interface ReactionBarProps {
  reactions: ReactionCounts;
  activeReactions: Set<ReactionType>;
  onReact: (type: ReactionType) => void;
}

const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string }[] =
  [
    { type: "rock", emoji: "🤘", label: "Rock" },
    { type: "heart", emoji: "❤️", label: "Heart" },
    { type: "broken_heart", emoji: "💔", label: "Broken heart" },
    { type: "party", emoji: "🎉", label: "Party" },
  ];

export function ReactionBar({
  reactions,
  activeReactions,
  onReact,
}: ReactionBarProps) {
  return (
    <div className="flex items-center justify-around px-4 py-3">
      {REACTION_CONFIG.map(({ type, emoji, label }) => {
        const isActive = activeReactions.has(type);
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            aria-label={`${label} reaction`}
            aria-pressed={isActive}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all active:scale-95 ${
              isActive
                ? "bg-brand-pink/20 border-brand-pink"
                : "border-transparent hover:border-brand-dark-border"
            }`}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span
              className={`text-xs font-medium tabular-nums ${
                isActive ? "text-brand-pink" : "text-white/60"
              }`}
            >
              {reactions[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
