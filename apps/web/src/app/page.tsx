import type { StationWithDJ } from "@ownradio/shared";
import { Hero } from "@/components/landing/Hero";
import { FeaturedStations } from "@/components/landing/FeaturedStations";
import { TopDJs } from "@/components/landing/TopDJs";
import { TrendingSongs } from "@/components/landing/TrendingSongs";
import { LoginSection } from "@/components/landing/LoginSection";

async function fetchStations(): Promise<StationWithDJ[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/stations`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json() as Promise<StationWithDJ[]>;
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
