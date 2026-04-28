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

/** A floating DJ clip that plays over music at a specific program-timeline offset. */
export interface DjFloatingEvent {
  segment_id: string;
  segment_type: string;
  audio_url: string;
  duration_sec: number;
  program_offset_sec: number;
  duck_music: boolean;
}

export interface StationWithDJ extends Station {
  dj: DJ | null;
  listenerCount: number;
  currentSong: Song | null;
  /** Floating DJ events from the current program manifest — populated when a program is active. */
  djEvents?: DjFloatingEvent[] | null;
}

export interface Program {
  id: string;
  stationId: string;
  djId: string | null;
  title: string;
  description: string | null;
  recordedAt: string;       // ISO 8601
  durationSecs: number;
  playbackUrl: string;
  coverArtUrl: string | null;
}

export type StationStatus = 'off_air' | 'on_air';

export interface LanguageWeight {
  code: string;
  weight: number;
}

export interface OwnedStation extends Station {
  status: StationStatus;
  playgenStationId: string | null;
  ownerId: string | null;
  dj: OwnedDJ | null;
}

export interface OwnedDJ extends DJ {
  playgenDjId: string | null;
  localeCities: string[];
  languages: LanguageWeight[];
  personality: string | null;
}

export interface StationProgram {
  id: string;
  stationId: string;
  playgenProgramId: string | null;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationSecs: number;
}

export interface TtsVoice {
  id: string;
  name: string;
  locale: string;
}

export interface ReadinessCheck {
  station: boolean;
  dj: boolean;
  program: boolean;
  status: StationStatus;
}
