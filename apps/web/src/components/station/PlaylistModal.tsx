'use client';

interface PlaylistModalProps { onClose: () => void; }

const MOCK_TRACKS = [
  { title: 'Midnight Drive', artist: 'Synthwave Rider', duration: '3:42' },
  { title: 'Neon Lights',    artist: 'City Echo',       duration: '4:15' },
  { title: 'Rainy Seoul',    artist: 'Lo-Fi Dreams',    duration: '3:58' },
  { title: 'Tokyo Drift',    artist: 'Urban Pulse',     duration: '4:02' },
  { title: 'Slow Burn',      artist: 'Velvet Haze',     duration: '5:10' },
  { title: 'Late Night Run', artist: 'Chrome Hearts',   duration: '3:33' },
];

export function PlaylistModal({ onClose }: PlaylistModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Playlist</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>&#x2715;</button>
        </div>
        {MOCK_TRACKS.map((track, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎵</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{track.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{track.artist}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{track.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
