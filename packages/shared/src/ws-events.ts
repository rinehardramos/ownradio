import type { ReactionType, ReactionCounts } from "./station.js";

export interface ClientEvents {
  join_station(payload: { stationSlug: string }): void;
  leave_station(payload: { stationSlug: string }): void;
  reaction(payload: { songId: string; type: ReactionType }): void;
  chat_message(payload: { content: string }): void;
}

export interface ServerEvents {
  now_playing(payload: { title: string; artist: string; albumCoverUrl: string | null }): void;
  reaction_update(payload: { songId: string; counts: ReactionCounts }): void;
  new_message(payload: { displayName: string; content: string; createdAt: string }): void;
  listener_count(payload: { count: number }): void;
  station_status(payload: { isLive: boolean }): void;
  error(payload: { message: string }): void;
}
