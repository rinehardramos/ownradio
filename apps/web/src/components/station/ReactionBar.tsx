'use client';
import { useState } from 'react';
import { Zap, Heart, Music, Moon, ThumbsDown, type LucideIcon } from 'lucide-react';
import { ReactionType } from '@ownradio/shared';

const REACTIONS: { type: ReactionType; Icon: LucideIcon; label: string }[] = [
  { type: 'rock',   Icon: Zap,        label: 'Rock'   },
  { type: 'love',   Icon: Heart,      label: 'Love'   },
  { type: 'vibe',   Icon: Music,      label: 'Vibe'   },
  { type: 'sleepy', Icon: Moon,       label: 'Sleepy' },
  { type: 'nah',    Icon: ThumbsDown, label: 'Nah'    },
];

interface ReactionBarProps {
  activeReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  orientation?: 'vertical' | 'horizontal';
}

export function ReactionBar({ activeReaction, onReact, orientation = 'vertical' }: ReactionBarProps) {
  const isVertical = orientation === 'vertical';
  const [hoveredType, setHoveredType] = useState<ReactionType | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: '8px', padding: '8px' }}>
      {REACTIONS.map(({ type, Icon, label }) => {
        const isActive = activeReaction === type;
        const isLove = type === 'love';
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            aria-label={label}
            aria-pressed={isActive}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={(e) => { setHoveredType(null); (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              border: isActive
                ? '1.5px solid rgba(255,45,120,0.5)'
                : hoveredType === type
                  ? '1.5px solid rgba(255,255,255,0.15)'
                  : '1.5px solid transparent',
              background: isActive
                ? 'rgba(255,45,120,0.12)'
                : hoveredType === type
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent',
              boxShadow: isActive ? '0 0 14px rgba(255,45,120,0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.85)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            <Icon
              size={20}
              strokeWidth={1.75}
              color={isActive ? '#ff2d78' : 'rgba(255,255,255,0.65)'}
              fill={isActive && isLove ? 'rgba(255,45,120,0.9)' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}
