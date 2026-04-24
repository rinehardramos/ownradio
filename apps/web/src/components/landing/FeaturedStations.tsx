import Link from "next/link";
import type { StationWithDJ } from "@ownradio/shared";
import { getStationPlaceholder } from "@/lib/placeholders";

interface FeaturedStationsProps {
  stations: StationWithDJ[];
  stationCount?: number;
  listenerCount?: number;
  djCount?: number;
  liveCount?: number;
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function FeaturedStations({ stations, stationCount, listenerCount, djCount, liveCount }: FeaturedStationsProps) {
  if (stations.length === 0) {
    return (
      <section className="w-full py-8">
        <h2 className="text-lg font-bold text-white mb-4">Featured Stations</h2>
        <p className="text-sm text-white/40">No stations available right now. Check back soon!</p>
      </section>
    );
  }

  return (
    <section className="slide-up w-full py-8">
      <h2 className="text-lg font-bold text-white mb-4">Featured Stations</h2>
      {stationCount != null && (
        <div className="mb-6 flex justify-center gap-8 flex-wrap">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--pink)" }}>{stationCount}</span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">Stations</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "#22c55e" }}>{liveCount}</span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">Live Now</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--pink)" }}>{fmt(listenerCount ?? 0)}</span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">Listeners</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--pink)" }}>{djCount}</span>
            <span className="mt-1 text-xs uppercase tracking-wider text-white/50">DJs</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stations.map((station) => {
          const isPlaceholder = !station.isLive && !station.streamUrl;

          const card = (
            <div
              className={isPlaceholder ? undefined : 'card-hover'}
              style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', cursor: isPlaceholder ? 'default' : undefined }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStationPlaceholder(station.genre)}
                alt={station.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(1.2)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,26,0.95) 0%, rgba(0,0,0,0.1) 60%)' }} />

              {/* Play button overlay — revealed on hover */}
              {!isPlaceholder && (
                <div className="card-play-btn">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              )}

              {/* Listener count (top right) */}
              {station.isLive && station.listenerCount > 0 && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                  {station.listenerCount >= 1000 ? `${(station.listenerCount / 1000).toFixed(1)}K` : station.listenerCount}
                </div>
              )}

              {/* LIVE or COMING SOON badge */}
              <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                {station.isLive
                  ? (
                    <span style={{ background: 'var(--pink)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center' }}>
                      <span className="dot-live" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', marginRight: '5px' }} />
                      LIVE
                    </span>
                  )
                  : <span style={{ background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>COMING SOON</span>
                }
              </div>

              {/* Station info at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{station.genre}</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{station.name}</div>
                {station.dj && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>DJ {station.dj.name}</div>
                )}
                {station.currentSong && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ♪ {station.currentSong.title} — {station.currentSong.artist}
                  </div>
                )}
              </div>
            </div>
          );

          if (isPlaceholder) {
            return (
              <div key={station.id}>
                {card}
              </div>
            );
          }

          return (
            <Link key={station.id} href={`/station/${station.slug}`}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
