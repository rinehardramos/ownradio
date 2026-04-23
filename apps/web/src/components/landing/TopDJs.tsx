import type { DJ } from "@ownradio/shared";
import { DJ_PLACEHOLDER } from "@/lib/placeholders";

interface TopDJsProps {
  djs: DJ[];
}

export function TopDJs({ djs }: TopDJsProps) {
  if (djs.length === 0) {
    return (
      <section className="w-full py-8">
        <h2 className="text-lg font-bold text-white mb-4">Top DJs</h2>
        <p className="text-sm text-white/40">No DJs online right now.</p>
      </section>
    );
  }

  return (
    <section className="w-full py-8">
      <h2 className="text-lg font-bold text-white mb-4">Top DJs</h2>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }} className="scrollbar-hide">
        {djs.map((dj) => (
          <div key={dj.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0, cursor: 'pointer' }}>
            <div className="avatar-glow" style={{ position: 'relative' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border-medium)', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dj.avatarUrl || DJ_PLACEHOLDER} alt={dj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Online dot */}
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg-primary)' }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {dj.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
