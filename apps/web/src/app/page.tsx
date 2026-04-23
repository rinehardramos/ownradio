import type { StationWithDJ } from "@ownradio/shared";
import { apiFetch } from "@/lib/api";
import { OWNRADIO_SLUG, OWNRADIO_FALLBACK, mergeWithMocks } from "@/lib/mock-stations";
import { HeroStation } from "@/components/landing/HeroStation";
import { FeaturedStations } from "@/components/landing/FeaturedStations";
import { TopDJs } from "@/components/landing/TopDJs";
import { TrendingSongs } from "@/components/landing/TrendingSongs";
import { LoginSection } from "@/components/landing/LoginSection";
import { LandingShell } from "@/components/layout/LandingShell";

async function fetchStations(): Promise<StationWithDJ[]> {
  try {
    return await apiFetch<StationWithDJ[]>("/stations");
  } catch {
    return [];
  }
}

export default async function Home() {
  const apiStations = await fetchStations();
  const allStations = mergeWithMocks(apiStations);

  // Extract the OwnRadio station for the hero spotlight (fallback if API is down)
  const heroStation =
    allStations.find((s) => s.slug === OWNRADIO_SLUG) ?? OWNRADIO_FALLBACK;

  // All stations including OwnRadio for stats, but exclude it from the grid
  const stations = allStations.filter((s) => s.slug !== OWNRADIO_SLUG);
  const stationsWithHero = [heroStation, ...stations];

  const djs = stationsWithHero.flatMap((s) => (s.dj ? [s.dj] : []));

  const songs = stationsWithHero.flatMap((s) =>
    s.currentSong
      ? [{ song: s.currentSong, stationName: s.name, reactionCount: s.listenerCount ?? 0 }]
      : []
  );

  const liveStations = stationsWithHero.filter((s) => s.isLive);
  const totalListeners = stationsWithHero.reduce((sum, s) => sum + (s.listenerCount ?? 0), 0);

  return (
    <LandingShell stations={stationsWithHero}>
      <main className="overflow-y-auto">
        <HeroStation
          station={heroStation}
          stationCount={stationsWithHero.length}
          listenerCount={totalListeners}
          djCount={djs.length}
          liveCount={liveStations.length}
        />
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
          <FeaturedStations stations={stations} />
          <TopDJs djs={djs} />
          <TrendingSongs songs={songs} />
          <LoginSection />
        </div>
      </main>
    </LandingShell>
  );
}
