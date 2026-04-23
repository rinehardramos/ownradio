'use client';

interface FansModalProps { listenerCount: number; onClose: () => void; }

const COLORS = ['#ff2d78','#6c63ff','#00bcd4','#ff9800','#4caf50','#e91e63','#9c27b0','#3f51b5'];
const MOCK_FANS = Array.from({ length: 20 }, (_, i) => ({
  name: `Listener ${i + 1}`,
  initial: String.fromCharCode(65 + (i % 26)),
  color: COLORS[i % COLORS.length],
}));

export function FansModal({ listenerCount, onClose }: FansModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Fans · {listenerCount.toLocaleString()} listening</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>&#x2715;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {MOCK_FANS.map((fan, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: fan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                {fan.initial}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>{fan.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
