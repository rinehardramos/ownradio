export default function LibraryPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Your Library</h1>
      {['Your Stations', 'Recently Played', 'Liked Songs'].map((section) => (
        <div key={section} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>{section}</h2>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📻</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Browse stations to add to your library</div>
          </div>
        </div>
      ))}
    </div>
  );
}
