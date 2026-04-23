'use client';

interface TopSongsModalProps { onClose: () => void; }

const MOCK_TOP = [
  { title: 'Neon Lights',    artist: 'City Echo',       plays: 1240 },
  { title: 'Midnight Drive', artist: 'Synthwave Rider', plays: 987  },
  { title: 'Rainy Seoul',    artist: 'Lo-Fi Dreams',    plays: 854  },
  { title: 'Tokyo Drift',    artist: 'Urban Pulse',     plays: 731  },
  { title: 'Slow Burn',      artist: 'Velvet Haze',     plays: 698  },
  { title: 'Late Night Run', artist: 'Chrome Hearts',   plays: 621  },
  { title: 'Electric Feel',  artist: 'Prism Wave',      plays: 589  },
  { title: 'Golden Hour',    artist: 'Sun Drift',       plays: 502  },
  { title: 'Phantom Bass',   artist: 'Deep Echo',       plays: 477  },
  { title: 'Aurora',         artist: 'Night Owl',       plays: 441  },
];

export function TopSongsModal({ onClose }: TopSongsModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Top 10</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>&#x2715;</button>
        </div>
        {MOCK_TOP.map((song, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '24px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: i < 3 ? 'var(--pink)' : 'var(--text-tertiary)' }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{song.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.artist}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{song.plays.toLocaleString()} plays</div>
          </div>
        ))}
      </div>
    </div>
  );
}
