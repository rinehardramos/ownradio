import type { Song } from "@ownradio/shared";

interface TrendingSong {
  song: Song;
  stationName: string;
  reactionCount: number;
}

interface TrendingSongsProps {
  songs: TrendingSong[];
}

export function TrendingSongs({ songs }: TrendingSongsProps) {
  return (
    <section className="w-full py-8 px-6">
      <h2 className="text-lg font-bold text-white mb-4">Trending Songs</h2>
      <ol className="flex flex-col gap-3">
        {songs.map((item, index) => (
          <li
            key={item.song.id}
            className="flex items-center gap-4 rounded-xl bg-brand-dark-card border border-brand-dark-border px-4 py-3"
          >
            {/* Rank */}
            <span className="w-6 text-center text-sm font-bold text-brand-pink flex-none">
              {index + 1}
            </span>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {item.song.title}
              </p>
              <p className="text-xs text-white/50 truncate">
                {item.song.artist} &middot; {item.stationName}
              </p>
            </div>

            {/* Reaction count */}
            <div className="flex items-center gap-1 flex-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-brand-pink"
                aria-hidden="true"
              >
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              <span className="text-xs text-white/70">{item.reactionCount}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
