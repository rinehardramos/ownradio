import type { StationWithDJ } from "@ownradio/shared";
import { apiFetch } from "@/lib/api";
import { OWNRADIO_SLUG, mergeWithMocks } from "@/lib/mock-stations";
import { HeroCoverFlow } from "@/components/landing/HeroCoverFlow";
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

  const liveStations = allStations.filter((s) => s.isLive);
  const nonLiveStations = allStations.filter((s) => !s.isLive);

  const ownradioIndex = Math.max(0, liveStations.findIndex((s) => s.slug === OWNRADIO_SLUG));

  const djs = allStations.flatMap((s) => (s.dj ? [s.dj] : []));
  const songs = allStations.flatMap((s) =>
    s.currentSong
      ? [{ song: s.currentSong, stationName: s.name, reactionCount: s.listenerCount ?? 0 }]
      : []
  );
  const totalListeners = allStations.reduce((sum, s) => sum + (s.listenerCount ?? 0), 0);

  return (
    <LandingShell stations={allStations}>
      <main className="overflow-y-auto">
        <HeroCoverFlow stations={liveStations} initialIndex={ownradioIndex} />
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
          <FeaturedStations
            stations={nonLiveStations}
            stationCount={allStations.length}
            listenerCount={totalListeners}
            djCount={djs.length}
            liveCount={liveStations.length}
          />
          <TopDJs djs={djs} />
          <TrendingSongs songs={songs} />
          <LoginSection />
        </div>
      </main>
    </LandingShell>
  );
}
