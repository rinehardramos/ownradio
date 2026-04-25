'use client';
import Link from 'next/link';
import { getStationPlaceholder } from '@/lib/placeholders';
import type { Station } from '@ownradio/shared';

interface SidebarProps {
  stations: Station[];
  activeStationId?: string;
  onStationClick: (index: number) => void;
}

const NavIcon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_LINKS = [
  { href: '/',        label: 'Home',    icon: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z' },
  { href: '/browse',  label: 'Browse',  icon: 'M12 2a7 7 0 017 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 017-7zm0 4a3 3 0 100 6 3 3 0 000-6z' },
  { href: '/library', label: 'Library', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h14v14H6.5A2.5 2.5 0 004 19.5z' },
  { href: '/profile', label: 'Profile', icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z' },
];

export function Sidebar({ stations, activeStationId, onStationClick }: SidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)' }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, background: 'linear-gradient(135deg, var(--pink), var(--pink-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          OwnRadio
        </span>
      </div>
      <nav style={{ padding: '8px' }}>
        {NAV_LINKS.map(({ href, label, icon }) => (
          <Link key={href} href={href} className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
            <NavIcon d={icon} /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 16px' }} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }} className="scrollbar-hide">
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', padding: '6px 12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Stations</div>
        {stations.map((station, index) => {
          const isActive = station.id === activeStationId;
          return (
            <button key={station.id} onClick={() => onStationClick(index)} className="sidebar-station"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: isActive ? 'rgba(255,45,120,0.12)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <img src={station.artworkUrl || getStationPlaceholder(station.genre)} alt=""
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? 'var(--pink)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{station.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{station.genre}</div>
              </div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: station.isLive ? '#22c55e' : 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
