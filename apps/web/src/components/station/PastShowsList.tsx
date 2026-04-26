'use client';
import { Music, Play, Square, Clock } from 'lucide-react';
import type { Program } from '@ownradio/shared';

interface PastShowsListProps {
  programs: Program[];
  onPlay: (program: Program) => void;
  activeProgram: Program | null;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PastShowsList({ programs, onPlay, activeProgram }: PastShowsListProps) {
  if (programs.length === 0) {
    return (
      <div style={{ padding: '12px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
        No past shows yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {programs.map((prog) => {
        const isActive = activeProgram?.id === prog.id;
        return (
          <div
            key={prog.id}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}
          >
            {/* Cover art */}
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {prog.coverArtUrl
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={prog.coverArtUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Music size={16} strokeWidth={1.75} color="rgba(255,255,255,0.3)" />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#ff2d78' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prog.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                <Clock size={10} strokeWidth={1.75} />
                <span>{formatDuration(prog.durationSecs)}</span>
                <span>·</span>
                <span>{formatDate(prog.recordedAt)}</span>
              </div>
            </div>

            {/* Play/stop button */}
            <button
              onClick={() => onPlay(prog)}
              aria-label={isActive ? 'Stop' : `Play ${prog.title}`}
              style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(255,45,120,0.4)', background: isActive ? 'rgba(255,45,120,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms' }}
            >
              {isActive
                ? <Square size={12} strokeWidth={2} color="#ff2d78" fill="#ff2d78" />
                : <Play size={12} strokeWidth={2} color="rgba(255,255,255,0.6)" style={{ marginLeft: 1 }} />
              }
            </button>
          </div>
        );
      })}
    </div>
  );
}
