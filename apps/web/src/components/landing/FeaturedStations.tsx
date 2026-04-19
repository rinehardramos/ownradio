import Link from "next/link";
import type { StationWithDJ } from "@ownradio/shared";

interface FeaturedStationsProps {
  stations: StationWithDJ[];
}

const GENRE_GRADIENTS: Record<string, string> = {
  Rock: "from-red-800 to-orange-700",
  "Hip-Hop / R&B": "from-purple-800 to-blue-700",
  "Lo-Fi / Ambient": "from-teal-800 to-cyan-700",
  OPM: "from-yellow-700 to-pink-700",
};

function getGradient(genre: string): string {
  return GENRE_GRADIENTS[genre] ?? "from-brand-dark-card to-brand-dark-border";
}

export function FeaturedStations({ stations }: FeaturedStationsProps) {
  return (
    <section className="w-full py-8">
      <h2 className="text-lg font-bold text-white mb-4">Featured Stations</h2>
      {/* Mobile: horizontal scroll — Desktop: grid */}
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stations.map((station) => (
          <Link
            key={station.id}
            href={`/station/${station.slug}`}
            className="flex-none sm:flex-auto"
            style={{ width: 160 }}
          >
            <div
              className={`relative flex flex-col justify-between rounded-2xl bg-gradient-to-br ${getGradient(station.genre)} p-4 h-48 cursor-pointer hover:opacity-90 transition-opacity w-full`}
            >
              {/* Live badge */}
              {station.isLive && (
                <span className="self-start rounded-full bg-brand-pink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  LIVE
                </span>
              )}

              {/* Bottom info */}
              <div className="mt-auto">
                <p className="text-sm font-bold text-white leading-tight truncate">
                  {station.name}
                </p>
                <span className="mt-1 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/80">
                  {station.genre}
                </span>
                {station.dj && (
                  <p className="mt-1 text-xs text-white/70 truncate">
                    {station.dj.name}
                  </p>
                )}
                {station.currentSong && (
                  <p className="mt-0.5 text-[11px] text-white/50 truncate">
                    {station.currentSong.title}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3 text-white/50"
                    aria-hidden="true"
                  >
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM2 17a6 6 0 0116 0H2z" />
                  </svg>
                  <span className="text-[10px] text-white/50">
                    {station.listenerCount ?? 50}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
