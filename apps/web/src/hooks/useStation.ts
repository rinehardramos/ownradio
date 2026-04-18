"use client";

import { useState, useCallback } from "react";
import type {
  StationWithDJ,
  Song,
  ReactionType,
  ReactionCounts,
  ChatMessage,
  Listener,
} from "@ownradio/shared";

interface UseStationReturn {
  currentSong: Song | null;
  reactions: ReactionCounts;
  messages: ChatMessage[];
  listenerCount: number;
  activeReactions: Set<ReactionType>;
  sendReaction: (type: ReactionType) => void;
  sendMessage: (content: string, user: Listener) => void;
}

function randomListenerCount(): number {
  return Math.floor(Math.random() * (80 - 12 + 1)) + 12;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useStation(station: StationWithDJ): UseStationReturn {
  const [reactions, setReactions] = useState<ReactionCounts>({
    heart: 0,
    rock: 0,
    broken_heart: 0,
    party: 0,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [listenerCount] = useState<number>(randomListenerCount);

  const [activeReactions, setActiveReactions] = useState<Set<ReactionType>>(
    new Set()
  );

  const sendReaction = useCallback((type: ReactionType) => {
    setReactions((prev) => {
      const delta = activeReactions.has(type) ? -1 : 1;
      return { ...prev, [type]: Math.max(0, prev[type] + delta) };
    });
    setActiveReactions((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, [activeReactions]);

  const sendMessage = useCallback(
    (content: string, user: Listener) => {
      const message: ChatMessage = {
        id: generateId(),
        stationId: station.id,
        listenerId: user.id,
        displayName: user.username,
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, message]);
    },
    [station.id]
  );

  return {
    currentSong: station.currentSong,
    reactions,
    messages,
    listenerCount,
    activeReactions,
    sendReaction,
    sendMessage,
  };
}
