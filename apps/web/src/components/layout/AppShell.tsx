'use client';
import { useState, useEffect, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomPlayerBar } from './BottomPlayerBar';
import type { Station } from '@ownradio/shared';

interface AppShellProps {
  // Sidebar
  stations: Station[];
  activeStationId?: string;
  onStationChange: (index: number) => void;
  // Dot nav
  stationCount: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  // Player bar
  currentSong: { title: string; artist: string } | null;
  currentStation: Station | null;
  isPlaying: boolean;
  volume: number;
  listenerCount: number;
  onTogglePlay: () => void;
  onVolumeChange: (v: number) => void;
  // Slots
  children: ReactNode;
  chatContent: ReactNode;
}

export function AppShell({
  stations, activeStationId, onStationChange,
  stationCount, currentIndex, onDotClick,
  currentSong, currentStation, isPlaying, volume, listenerCount, onTogglePlay, onVolumeChange,
  children, chatContent,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft')  onDotClick(Math.max(0, currentIndex - 1));
      if (e.key === 'ArrowRight') onDotClick(Math.min(stationCount - 1, currentIndex + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, stationCount, onDotClick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button onClick={() => setSidebarOpen(o => !o)} className="btn-press" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>&#9776;</button>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {Array.from({ length: stationCount }, (_, i) => (
            <button key={i} onClick={() => onDotClick(i)}
              style={{ width: i === currentIndex ? '20px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: i === currentIndex ? 'var(--pink)' : 'var(--border-medium)', cursor: 'pointer', padding: 0, transition: 'all 300ms cubic-bezier(.4,0,.2,1)' }} />
          ))}
        </div>
        <button onClick={() => setChatOpen(o => !o)} className="btn-press" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>&#128172;</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && (
          <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
            <Sidebar stations={stations} activeStationId={activeStationId} onStationClick={onStationChange} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-hide">{children}</div>
        {chatOpen && (
          <div style={{ width: '320px', flexShrink: 0, borderLeft: '1px solid var(--border-subtle)' }}>{chatContent}</div>
        )}
      </div>

      {/* Bottom Player Bar */}
      <BottomPlayerBar
        currentSong={currentSong} station={currentStation}
        isPlaying={isPlaying} volume={volume} listenerCount={listenerCount}
        onTogglePlay={onTogglePlay} onVolumeChange={onVolumeChange}
      />
    </div>
  );
}
