'use client';
import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import type { Station } from '@ownradio/shared';

interface LandingShellProps {
  stations: Station[];
  children: ReactNode;
}

export function LandingShell({ stations, children }: LandingShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => setSidebarOpen(o => !o)} className="btn-press" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>&#9776;</button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>OwnRadio</span>
        <div style={{ width: '32px' }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex' }}>
        {sidebarOpen && (
          <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', position: 'sticky', top: '48px', height: 'calc(100vh - 48px)', alignSelf: 'flex-start' }}>
            <Sidebar
              stations={stations}
              activeStationId={undefined}
              onStationClick={(index) => {
                const s = stations[index];
                if (s?.slug) router.push(`/station/${s.slug}`);
              }}
            />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}
