import Link from "next/link";
import type { StationWithDJ } from "@ownradio/shared";
import { getStationPlaceholder } from "@/lib/placeholders";

interface FeaturedStationsProps {
  stations: StationWithDJ[];
}

export function FeaturedStations({ stations }: FeaturedStationsProps) {
  if (stations.length === 0) {
    return (
      <section className="w-full py-8">
        <h2 className="text-lg font-bold text-white mb-4">Featured Stations</h2>
        <p className="text-sm text-white/40">No stations available right now. Check back soon!</p>
      </section>
    );
  }

  return (
    <section className="w-full py-8">
      <h2 className="text-lg font-bold text-white mb-4">Featured Stations</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stations.map((station) => {
          const isPlaceholder = !station.isLive && !station.streamUrl;

          const card = (
            <div
              style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', cursor: isPlaceholder ? 'default' : 'pointer' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStationPlaceholder(station.genre)}
                alt={station.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(1.2)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,26,0.95) 0%, rgba(0,0,0,0.1) 60%)' }} />

              {/* LIVE or COMING SOON badge */}
              <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                {station.isLive
                  ? <span style={{ background: 'var(--pink)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, color: '#fff' }}>LIVE</span>
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
