'use client';

interface BottomPlayerBarProps {
  currentSong: { title: string; artist: string } | null;
  station: { name: string } | null;
  isPlaying: boolean;
  volume: number;
  listenerCount: number;
  onTogglePlay: () => void;
  onVolumeChange: (v: number) => void;
}

export function BottomPlayerBar({ currentSong, station, isPlaying, volume, listenerCount, onTogglePlay, onVolumeChange }: BottomPlayerBarProps) {
  const pct = Math.round(volume * 100);
  const sliderBg = `linear-gradient(to right, var(--pink) 0%, var(--pink) ${pct}%, var(--border-medium) ${pct}%, var(--border-medium) 100%)`;

  return (
    <div style={{ height: '72px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px' }}>
      {/* Left: 240px — album art + song info */}
      <div style={{ width: '240px', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎵</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong?.title ?? 'Not playing'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSong?.artist ?? ''}{station ? ` · ${station.name}` : ''}
          </div>
        </div>
      </div>
      {/* Center: play button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onTogglePlay} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#fff', color: '#000', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
      {/* Right: 240px — listener count + volume */}
      <div style={{ width: '240px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {listenerCount.toLocaleString()}
        </span>
        <input type="range" min={0} max={1} step={0.01} value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={{ width: '100px', background: sliderBg }} />
      </div>
    </div>
  );
}
