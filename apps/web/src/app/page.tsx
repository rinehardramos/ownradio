import type { StationWithDJ } from "@ownradio/shared";
import { apiFetch } from "@/lib/api";
import { Hero } from "@/components/landing/Hero";
import { FeaturedStations } from "@/components/landing/FeaturedStations";
import { TopDJs } from "@/components/landing/TopDJs";
import { TrendingSongs } from "@/components/landing/TrendingSongs";
import { LoginSection } from "@/components/landing/LoginSection";

async function fetchStations(): Promise<StationWithDJ[]> {
  try {
    return await apiFetch<StationWithDJ[]>("/stations");
  } catch {
    return [];
  }
}

export default async function Home() {
  const stations = await fetchStations();

  const djs = stations.flatMap((s) => (s.dj ? [s.dj] : []));

  const songs = stations.flatMap((s) =>
    s.currentSong
      ? [
          {
            song: s.currentSong,
            stationName: s.name,
            reactionCount: s.listenerCount ?? 0,
          },
        ]
      : []
  );

  const totalListeners = stations.reduce(
    (sum, s) => sum + (s.listenerCount ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-brand-dark overflow-y-auto">
      <Hero
        stationCount={stations.length}
        listenerCount={totalListeners}
        djCount={djs.length}
      />
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
        <FeaturedStations stations={stations} />
        <TopDJs djs={djs} />
        <TrendingSongs songs={songs} />
        <LoginSection />
      </div>
    </main>
  );
}
