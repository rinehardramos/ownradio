import { MOCK_STATIONS } from "@/lib/mock-data";
import { Hero } from "@/components/landing/Hero";
import { FeaturedStations } from "@/components/landing/FeaturedStations";
import { TopDJs } from "@/components/landing/TopDJs";
import { TrendingSongs } from "@/components/landing/TrendingSongs";
import { LoginSection } from "@/components/landing/LoginSection";

export default function Home() {
  // Derive unique DJs from stations
  const djs = MOCK_STATIONS.flatMap((s) => (s.dj ? [s.dj] : []));

  // Fixed mock reaction counts — stable across renders
  const MOCK_REACTION_COUNTS = [74, 52, 31, 88];

  // Derive trending songs with mock reaction counts
  const songs = MOCK_STATIONS.flatMap((s, i) =>
    s.currentSong
      ? [
          {
            song: s.currentSong,
            stationName: s.name,
            reactionCount: MOCK_REACTION_COUNTS[i] ?? 20,
          },
        ]
      : []
  );

  const totalListeners = MOCK_STATIONS.reduce(
    (sum, s) => sum + (s.listenerCount ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-brand-dark overflow-y-auto">
      <Hero
        stationCount={MOCK_STATIONS.length}
        listenerCount={totalListeners}
        djCount={djs.length}
      />
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
        <FeaturedStations stations={MOCK_STATIONS} />
        <TopDJs djs={djs} />
        <TrendingSongs songs={songs} />
        <LoginSection />
      </div>
    </main>
  );
}
