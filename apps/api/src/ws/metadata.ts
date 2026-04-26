import type { Server as IOServer } from "socket.io";
import { prisma } from "../db/client.js";
import { maybeRegenerateArtwork, initArtworkGenerator } from '../services/artworkGenerator.js';

// Track last known song per station to skip duplicates
const lastSongByStation = new Map<string, string>(); // stationId -> "Artist - Title"

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

export async function pollStation(
  io: IOServer,
  stationId: string,
  slug: string,
  metadataUrl: string
): Promise<void> {
  const metadata = await fetchIcecastMetadata(metadataUrl);
  if (!metadata) return;

  const songKey = `${metadata.artist} - ${metadata.title}`;
  if (lastSongByStation.get(stationId) === songKey) return; // Same song, skip
  lastSongByStation.set(stationId, songKey);

  try {
    const song = await prisma.song.create({
      data: {
        stationId,
        title: metadata.title,
        artist: metadata.artist,
      },
    });

    io.to(`station:${slug}`).emit("now_playing", {
      id: song.id,
      stationId: song.stationId,
      title: song.title,
      artist: song.artist,
      albumCoverUrl: song.albumCoverUrl,
      playedAt: song.playedAt,
      duration: song.duration,
    });

    const recentSongs = await prisma.song.findMany({
      where: { stationId },
      orderBy: { playedAt: 'desc' },
      take: 5,
      select: { id: true, stationId: true, artist: true, title: true, playedAt: true, albumCoverUrl: true, duration: true },
    });
    await maybeRegenerateArtwork(stationId, recentSongs);
  } catch {
    // DB error — log but don't crash poller
    console.error(`Failed to save song for station ${slug}`);
  }
}

export async function startMetadataPollers(io: IOServer): Promise<void> {
  initArtworkGenerator(io);
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
