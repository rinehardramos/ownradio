import type { Server as IOServer } from "socket.io";
import { prisma } from "../db/client.js";

// Track last known song per station to skip duplicates
const lastSongByStation = new Map<string, string>(); // stationId -> "Artist - Title"

// Last full song object per slug — used to replay on join
const currentSongBySlug = new Map<string, object>();

export function getCurrentSongForSlug(slug: string): object | null {
  return currentSongBySlug.get(slug) ?? null;
}

// Active poll intervals
const pollIntervals = new Map<string, NodeJS.Timeout>();
let discoveryInterval: NodeJS.Timeout | null = null;

export async function fetchIcecastMetadata(
  metadataUrl: string
): Promise<{ title: string; artist: string } | null> {
  try {
    const res = await fetch(metadataUrl);
    if (!res.ok) return null;
    const data = await res.json();

    // PlayGen flat format: { artist: "Maki", song: "Dilaw", title: "Maki - Dilaw" }
    if (typeof data?.artist === "string" && typeof data?.song === "string") {
      const artist = data.artist.trim();
      const title = data.song.trim();
      if (artist && title) return { artist, title };
    }

    // Icecast JSON format: { icestats: { source: { title: "Artist - Title" } } }
    const rawTitle: string =
      data?.icestats?.source?.title ??
      data?.icestats?.source?.[0]?.title ??
      "";
    if (!rawTitle) return null;
    const dashIndex = rawTitle.indexOf(" - ");
    if (dashIndex === -1) {
      return { artist: "Unknown", title: rawTitle.trim() };
    }
    return {
      artist: rawTitle.substring(0, dashIndex).trim(),
      title: rawTitle.substring(dashIndex + 3).trim(),
    };
  } catch {
    return null;
  }
}

/** Save a new song to DB and broadcast now_playing to all listeners.
 *  Shared by the metadata poller and the client_now_playing socket handler. */
export async function onNewSong(
  io: IOServer,
  stationId: string,
  slug: string,
  artist: string,
  title: string,
): Promise<void> {
  const songKey = `${artist} - ${title}`;
  if (lastSongByStation.get(stationId) === songKey) return;
  lastSongByStation.set(stationId, songKey);

  try {
    const song = await prisma.song.create({
      data: { stationId, title, artist },
    });

    const nowPlaying = {
      id: song.id,
      stationId: song.stationId,
      title: song.title,
      artist: song.artist,
      albumCoverUrl: song.albumCoverUrl,
      playedAt: song.playedAt,
      duration: song.duration,
    };
    currentSongBySlug.set(slug, nowPlaying);
    io.to(`station:${slug}`).emit("now_playing", nowPlaying);

    // #33: Artwork generation removed from song change — now triggered per program delivery
  } catch {
    console.error(`Failed to save song for station ${slug}`);
  }
}

export async function pollStation(
  io: IOServer,
  stationId: string,
  slug: string,
  metadataUrl: string
): Promise<void> {
  const metadata = await fetchIcecastMetadata(metadataUrl);
  if (!metadata) return;
  await onNewSong(io, stationId, slug, metadata.artist, metadata.title);
}

export async function startMetadataPollers(io: IOServer): Promise<void> {
  // Initial load of live stations
  await refreshPollers(io);

  // Re-check for new/removed live stations every 30s
  discoveryInterval = setInterval(() => refreshPollers(io), 30_000);
}

async function refreshPollers(io: IOServer): Promise<void> {
  try {
    const liveStations = await prisma.station.findMany({
      where: { isLive: true },
      select: { id: true, slug: true, metadataUrl: true },
    });

    const liveIds = new Set(liveStations.map((s) => s.id));

    // Stop pollers for stations that went offline
    for (const [stationId, interval] of pollIntervals) {
      if (!liveIds.has(stationId)) {
        clearInterval(interval);
        pollIntervals.delete(stationId);
        lastSongByStation.delete(stationId);
        // find and clear slug entry
        for (const [s, _] of currentSongBySlug) {
          if (liveStations.every(st => st.slug !== s)) currentSongBySlug.delete(s);
        }
      }
    }

    // Start pollers for new live stations
    for (const station of liveStations) {
      if (!pollIntervals.has(station.id)) {
        const interval = setInterval(
          () => pollStation(io, station.id, station.slug, station.metadataUrl),
          5_000
        );
        pollIntervals.set(station.id, interval);
        // Immediate first poll
        pollStation(io, station.id, station.slug, station.metadataUrl);
      }
    }
  } catch {
    console.error("Failed to refresh station pollers");
  }
}

export function stopAllPollers(): void {
  for (const interval of pollIntervals.values()) clearInterval(interval);
  pollIntervals.clear();
  if (discoveryInterval) {
    clearInterval(discoveryInterval);
    discoveryInterval = null;
  }
  lastSongByStation.clear();
}
