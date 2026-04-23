export interface Station {
  id: string;
  name: string;
  slug: string;
  description: string;
  streamUrl: string;
  metadataUrl: string;
  genre: string;
  artworkUrl: string;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DJ {
  id: string;
  stationId: string;
  name: string;
  bio: string;
  avatarUrl: string;
  createdAt: string;
}

export interface Song {
  id: string;
  stationId: string;
  title: string;
  artist: string;
  albumCoverUrl: string | null;
  playedAt: string;
  duration: number | null;
}

export type ReactionType = "rock" | "love" | "vibe" | "sleepy" | "nah";

export interface Reaction {
  id: string;
  songId: string;
  stationId: string;
  listenerId: string | null;
  type: ReactionType;
  createdAt: string;
}

export interface ReactionCounts {
  rock: number;
  love: number;
  vibe: number;
  sleepy: number;
  nah: number;
}

export interface ChatMessage {
  id: string;
  stationId: string;
  listenerId: string | null;
  displayName: string;
  content: string;
  createdAt: string;
}

export interface StationWithDJ extends Station {
  dj: DJ | null;
  listenerCount: number;
  currentSong: Song | null;
}
