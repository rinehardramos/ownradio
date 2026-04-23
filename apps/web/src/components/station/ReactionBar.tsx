'use client';
import { ReactionType } from '@ownradio/shared';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'rock',   emoji: '🤘', label: 'Rock'   },
  { type: 'love',   emoji: '❤️', label: 'Love'   },
  { type: 'vibe',   emoji: '🎵', label: 'Vibe'   },
  { type: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { type: 'nah',    emoji: '👎', label: 'Nah'    },
];

interface ReactionBarProps {
  activeReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  orientation?: 'vertical' | 'horizontal';
}

export function ReactionBar({ activeReaction, onReact, orientation = 'vertical' }: ReactionBarProps) {
  const isVertical = orientation === 'vertical';
  return (
    <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: '8px', padding: '8px' }}>
      {REACTIONS.map(({ type, emoji, label }) => {
        const isActive = activeReaction === type;
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            aria-label={label}
            aria-pressed={isActive}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              borderRadius: 'var(--radius-md)',
              border: isActive
                ? '1.5px solid rgba(255,45,120,0.4)'
                : '1.5px solid var(--border-subtle)',
              background: isActive ? 'rgba(255,45,120,0.15)' : 'rgba(0,0,0,0.2)',
              boxShadow: isActive ? '0 0 14px rgba(255,45,120,0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.85)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
