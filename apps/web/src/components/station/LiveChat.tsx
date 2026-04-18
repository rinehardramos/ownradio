"use client";

import { useRef, useEffect, useState } from "react";
import type { ChatMessage, Listener } from "@ownradio/shared";

interface LiveChatProps {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  user: Listener | null;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LiveChat({ messages, onSend, user }: LiveChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !user) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || !user) return;
      onSend(trimmed);
      setInput("");
    }
  }

  return (
    <div className="flex flex-col bg-brand-dark-card rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-brand-dark-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Live Chat
        </span>
      </div>

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        style={{ maxHeight: 200 }}
      >
        {messages.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">
            No messages yet. Be the first!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-brand-pink text-xs font-semibold">
                  {msg.displayName}
                </span>
                <span className="text-white/30 text-xs">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p className="text-white/90 text-sm leading-snug">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 border-t border-brand-dark-border"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!user}
          placeholder={user ? "Say something..." : "Log in to chat"}
          maxLength={200}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!user || !input.trim()}
          className="text-xs font-semibold text-brand-pink disabled:opacity-30 hover:opacity-80 transition-opacity px-2 py-1"
        >
          Send
        </button>
      </form>
    </div>
  );
}
