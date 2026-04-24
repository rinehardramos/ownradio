import type { ReactionType, ReactionCounts } from "./station.js";

export interface ClientEvents {
  join_station(payload: { stationSlug: string }): void;
  leave_station(payload: { stationSlug: string }): void;
  reaction(payload: { songId: string; type: ReactionType }): void;
  chat_message(payload: { content: string }): void;
}

export interface StreamControlPayload {
  action: 'url_change' | 'stop' | 'resume';
  /** New stream URL when action is 'url_change' */
  streamUrl?: string;
  /** Slug of the station this event targets — used client-side to filter on the shared socket */
  stationSlug: string;
}

export interface DjSwitchPayload {
  djId: string;
  name: string;
  voiceStyle?: string;
  /** Slug of the station this event targets — used client-side to filter on the shared socket */
  stationSlug: string;
}

export interface ServerEvents {
  now_playing(payload: { title: string; artist: string; albumCoverUrl: string | null }): void;
  reaction_update(payload: { songId: string; counts: ReactionCounts }): void;
  new_message(payload: { displayName: string; content: string; createdAt: string }): void;
  listener_count(payload: { count: number }): void;
  station_status(payload: { isLive: boolean }): void;
  /** PlayGen → OwnRadio: change stream URL, stop, or resume playback */
  stream_control(payload: StreamControlPayload): void;
  /** PlayGen → OwnRadio: active DJ changed */
  dj_switch(payload: DjSwitchPayload): void;
  error(payload: { message: string }): void;
}
