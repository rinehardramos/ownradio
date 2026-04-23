export default function BrowsePage() {
  const GENRES = [
    { name: 'Rock', emoji: '🎸' }, { name: 'Pop', emoji: '🎤' },
    { name: 'Hip-Hop', emoji: '🎧' }, { name: 'Lo-Fi', emoji: '☕' },
    { name: 'OPM', emoji: '🌴' }, { name: 'Jazz', emoji: '🎷' },
    { name: 'Electronic', emoji: '⚡' }, { name: 'Classical', emoji: '🎻' },
  ];
  const MOODS = ['Chill', 'Hype', 'Focus', 'Late Night', 'Morning', 'Workout'];
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Browse</h1>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Genres</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {GENRES.map(({ name, emoji }) => (
          <div key={name} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</div>
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
