import type { Song } from "@ownradio/shared";
import { SONG_PLACEHOLDER } from "@/lib/placeholders";

interface TrendingSong {
  song: Song;
  stationName: string;
  reactionCount: number;
}

interface TrendingSongsProps {
  songs: TrendingSong[];
}

export function TrendingSongs({ songs }: TrendingSongsProps) {
  if (songs.length === 0) {
    return (
      <section className="w-full py-8">
        <h2 className="text-lg font-bold text-white mb-4">Trending Songs</h2>
        <p className="text-sm text-white/40">No songs playing right now.</p>
      </section>
    );
  }

  return (
    <section className="w-full py-8">
      <h2 className="text-lg font-bold text-white mb-4">Trending Songs</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 24px' }}>
        {songs.map((item, index) => (
          <div key={item.song.id ?? index} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ width: '20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)', textAlign: 'center', flexShrink: 0 }}>{index + 1}</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.song.albumCoverUrl || SONG_PLACEHOLDER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.song.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.song.artist}</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item.stationName}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
