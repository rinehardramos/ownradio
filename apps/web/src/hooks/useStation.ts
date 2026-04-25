"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  StationWithDJ,
  Song,
  ReactionType,
  ReactionCounts,
  ChatMessage,
  StreamControlPayload,
  DjSwitchPayload,
} from "@ownradio/shared";
import { getSocket } from "../lib/socket";

interface UseStationReturn {
  currentSong: Song | null;
  reactions: ReactionCounts;
  messages: ChatMessage[];
  listenerCount: number;
  activeReaction: ReactionType | null;
  /** Current stream URL — updates on stream_control url_change events */
  streamUrl: string | null;
  /** False while stream is stopped by a stream_control stop event */
  streamActive: boolean;
  /** Currently active DJ info from dj_switch events */
  activeDj: DjSwitchPayload | null;
  sendReaction: (type: ReactionType) => void;
  sendMessage: (content: string) => void;
}

export function useStation(station: StationWithDJ): UseStationReturn {
  const [currentSong, setCurrentSong] = useState<Song | null>(
    station.currentSong ?? null
  );
  const [reactions, setReactions] = useState<ReactionCounts>({
    rock: 0,
    love: 0,
    vibe: 0,
    sleepy: 0,
    nah: 0,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listenerCount, setListenerCount] = useState<number>(
    station.listenerCount ?? 0
  );
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
  // streamUrlOverride is set only by WebSocket stream_control events;
  // otherwise we use the station prop's streamUrl directly.
  const [streamUrlOverride, setStreamUrlOverride] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [activeDj, setActiveDj] = useState<DjSwitchPayload | null>(null);
  const [activeSlug, setActiveSlug] = useState(station.slug);

  // Derive effective stream URL: WebSocket override (if for this station) > station prop
  const streamUrl = streamUrlOverride ?? station.streamUrl ?? null;

  // Reset override when station changes — uses state comparison instead of refs
  // to comply with React strict mode (no ref access during render).
  if (activeSlug !== station.slug) {
    setActiveSlug(station.slug);
    setStreamUrlOverride(null);
    setStreamActive(true);
    setActiveDj(null);
  }

  // Keep a ref to currentSong so event handlers always see the latest value
  const currentSongRef = useRef<Song | null>(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("join_station", { slug: station.slug });

    function onNowPlaying(song: Song) {
      setCurrentSong(song);
      setActiveReaction(null); // reset on song change
    }

    function onReactionUpdate(data: { songId: string; counts: ReactionCounts }) {
      if (currentSongRef.current && data.songId === currentSongRef.current.id) {
        setReactions(data.counts);
      }
    }

    function onNewMessage(message: ChatMessage) {
      setMessages((prev) => [...prev, message]);
    }

    function onListenerCount(data: { slug: string; count: number }) {
      if (data.slug === station.slug) {
        setListenerCount(data.count);
      }
    }

    function onStreamControl(data: StreamControlPayload) {
      // Guard: ignore events not intended for this station (shared singleton socket)
      if (data.stationSlug !== station.slug) return;

      if (data.action === 'url_change' && data.streamUrl) {
        setStreamUrlOverride(data.streamUrl);
        setStreamActive(true);
      } else if (data.action === 'stop') {
        setStreamActive(false);
      } else if (data.action === 'resume') {
        setStreamActive(true);
      }
    }

    function onDjSwitch(data: DjSwitchPayload) {
      // Guard: ignore events not intended for this station (shared singleton socket)
      if (data.stationSlug !== station.slug) return;

      setActiveDj(data);
    }

    socket.on("now_playing", onNowPlaying);
    socket.on("reaction_update", onReactionUpdate);
    socket.on("new_message", onNewMessage);
    socket.on("listener_count", onListenerCount);
    socket.on("stream_control", onStreamControl);
    socket.on("dj_switch", onDjSwitch);

    return () => {
      socket.emit("leave_station");
      socket.off("now_playing", onNowPlaying);
      socket.off("reaction_update", onReactionUpdate);
      socket.off("new_message", onNewMessage);
      socket.off("listener_count", onListenerCount);
      socket.off("stream_control", onStreamControl);
      socket.off("dj_switch", onDjSwitch);
    };
  }, [station.slug]);

  const sendReaction = useCallback(
    (type: ReactionType) => {
      const next = activeReaction === type ? null : type;
      setActiveReaction(next);
      if (next !== null) {
        const socket = getSocket();
        socket.emit("reaction", {
          songId: currentSong?.id,
          stationId: station.id,
          type: next,
        });
      }
    },
    [activeReaction, currentSong, station.id]
  );

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getSocket();
      socket.emit("chat_message", {
        stationId: station.id,
        content,
      });
    },
    [station.id]
  );

  return {
    currentSong,
    reactions,
    messages,
    listenerCount,
    activeReaction,
    streamUrl,
    streamActive,
    activeDj,
    sendReaction,
    sendMessage,
  };
}
