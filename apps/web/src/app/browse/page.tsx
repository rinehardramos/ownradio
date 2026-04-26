import { Guitar, Mic, Headphones, Coffee, Music, Zap, type LucideIcon } from 'lucide-react';

export default function BrowsePage() {
  const GENRES: { name: string; Icon: LucideIcon }[] = [
    { name: 'Rock',       Icon: Guitar    },
    { name: 'Pop',        Icon: Mic       },
    { name: 'Hip-Hop',    Icon: Headphones },
    { name: 'Lo-Fi',      Icon: Coffee    },
    { name: 'OPM',        Icon: Mic       },
    { name: 'Jazz',       Icon: Music     },
    { name: 'Electronic', Icon: Zap       },
    { name: 'Classical',  Icon: Music     },
  ];
  const MOODS = ['Chill', 'Hype', 'Focus', 'Late Night', 'Morning', 'Workout'];
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Browse</h1>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Genres</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {GENRES.map(({ name, Icon }) => (
          <div key={name} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
              <Icon size={32} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{name}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Explore by Mood</h2>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }} className="scrollbar-hide">
        {MOODS.map((mood) => (
          <div key={mood} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', padding: '10px 24px', whiteSpace: 'nowrap', cursor: 'pointer', border: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 500 }}>
            {mood}
          </div>
        ))}
      </div>
    </div>
  );
}
