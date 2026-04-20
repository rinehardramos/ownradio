"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  StationWithDJ,
  Song,
  ReactionType,
  ReactionCounts,
  ChatMessage,
} from "@ownradio/shared";
import { getSocket } from "../lib/socket";

interface UseStationReturn {
  currentSong: Song | null;
  reactions: ReactionCounts;
  messages: ChatMessage[];
  listenerCount: number;
  activeReactions: Set<ReactionType>;
  sendReaction: (type: ReactionType) => void;
  sendMessage: (content: string) => void;
}

export function useStation(station: StationWithDJ): UseStationReturn {
  const [currentSong, setCurrentSong] = useState<Song | null>(
    station.currentSong ?? null
  );
  const [reactions, setReactions] = useState<ReactionCounts>({
    heart: 0,
    rock: 0,
    broken_heart: 0,
    party: 0,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listenerCount, setListenerCount] = useState<number>(
    station.listenerCount ?? 0
  );
  const [activeReactions, setActiveReactions] = useState<Set<ReactionType>>(
    new Set()
  );

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

    socket.on("now_playing", onNowPlaying);
    socket.on("reaction_update", onReactionUpdate);
    socket.on("new_message", onNewMessage);
    socket.on("listener_count", onListenerCount);

    return () => {
      socket.emit("leave_station");
      socket.off("now_playing", onNowPlaying);
      socket.off("reaction_update", onReactionUpdate);
      socket.off("new_message", onNewMessage);
      socket.off("listener_count", onListenerCount);
    };
  }, [station.slug]);

  const sendReaction = useCallback(
    (type: ReactionType) => {
      const song = currentSongRef.current;
      if (!song) return;

      // Optimistic toggle
      setActiveReactions((prev) => {
        const next = new Set(prev);
        if (next.has(type)) {
          next.delete(type);
        } else {
          next.add(type);
        }
        return next;
      });

      const socket = getSocket();
      socket.emit("reaction", {
        songId: song.id,
        stationId: station.id,
        type,
      });
    },
    [station.id]
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
    activeReactions,
    sendReaction,
    sendMessage,
  };
}
