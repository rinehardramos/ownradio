import type { StationWithDJ } from "@ownradio/shared";
import { apiFetch } from "@/lib/api";
import { Hero } from "@/components/landing/Hero";
import { FeaturedStations } from "@/components/landing/FeaturedStations";
import { TopDJs } from "@/components/landing/TopDJs";
import { TrendingSongs } from "@/components/landing/TrendingSongs";
import { LoginSection } from "@/components/landing/LoginSection";

const PLACEHOLDER_STATIONS: StationWithDJ[] = [
  {
    id: "placeholder-rock",
    name: "Rock Haven",
    slug: "rock-haven",
    description: "Classic and modern rock hits",
    streamUrl: "",
    metadataUrl: "",
    genre: "Rock",
    artworkUrl: "",
    isLive: false,
    createdAt: "",
    updatedAt: "",
    dj: {
      id: "dj-placeholder-1",
      stationId: "placeholder-rock",
      name: "DJ Axel",
      bio: "Rock aficionado spinning the best riffs.",
      avatarUrl: "",
      createdAt: "",
    },
    listenerCount: 0,
    currentSong: {
      id: "song-p1",
      stationId: "placeholder-rock",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      albumCoverUrl: null,
      playedAt: "",
      duration: 354,
    },
  },
  {
    id: "placeholder-hiphop",
    name: "Beat Street",
    slug: "beat-street",
    description: "Hip-hop and R&B vibes all day",
    streamUrl: "",
    metadataUrl: "",
    genre: "Hip-Hop / R&B",
    artworkUrl: "",
    isLive: false,
    createdAt: "",
    updatedAt: "",
    dj: {
      id: "dj-placeholder-2",
      stationId: "placeholder-hiphop",
      name: "MC Flow",
      bio: "Keeping the beat alive since day one.",
      avatarUrl: "",
      createdAt: "",
    },
    listenerCount: 0,
    currentSong: {
      id: "song-p2",
      stationId: "placeholder-hiphop",
      title: "Lose Yourself",
      artist: "Eminem",
      albumCoverUrl: null,
      playedAt: "",
      duration: 326,
    },
  },
  {
    id: "placeholder-lofi",
    name: "Chill Waves",
    slug: "chill-waves",
    description: "Lo-fi beats to relax and study",
    streamUrl: "",
    metadataUrl: "",
    genre: "Lo-Fi / Ambient",
    artworkUrl: "",
    isLive: false,
    createdAt: "",
    updatedAt: "",
    dj: {
      id: "dj-placeholder-3",
      stationId: "placeholder-lofi",
      name: "DJ Luna",
      bio: "Late-night lo-fi sessions.",
      avatarUrl: "",
      createdAt: "",
    },
    listenerCount: 0,
    currentSong: {
      id: "song-p3",
      stationId: "placeholder-lofi",
      title: "Snowman",
      artist: "WYS",
      albumCoverUrl: null,
      playedAt: "",
      duration: 180,
    },
  },
];

async function fetchStations(): Promise<StationWithDJ[]> {
  try {
    return await apiFetch<StationWithDJ[]>("/stations");
  } catch {
    return [];
  }
}

export default async function Home() {
  const apiStations = await fetchStations();

  // Pad with placeholders so the UI grid looks full
  const neededPlaceholders = Math.max(0, 4 - apiStations.length);
  const stations = [
    ...apiStations,
    ...PLACEHOLDER_STATIONS.slice(0, neededPlaceholders),
  ];

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

  const totalListeners = apiStations.reduce(
    (sum, s) => sum + (s.listenerCount ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-brand-dark overflow-y-auto">
      <Hero
        stationCount={apiStations.length}
        listenerCount={totalListeners}
        djCount={apiStations.flatMap((s) => (s.dj ? [s.dj] : [])).length}
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
