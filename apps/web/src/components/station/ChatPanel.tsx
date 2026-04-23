'use client';
import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Listener } from '@ownradio/shared';

interface ChatPanelProps {
  messages: ChatMessage[];
  user: Listener | null;
  onSend: (text: string) => void;
  onlineCount?: number;
  height?: string;
}

function getInitial(displayName: string): string {
  return displayName.charAt(0).toUpperCase();
}

export function ChatPanel({ messages, user, onSend, onlineCount = 0, height = '100%' }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !user) return;
    onSend(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>Live Chat</span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} />
        {onlineCount > 0 && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{onlineCount.toLocaleString()} online</span>
        )}
      </div>

      {/* Messages list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px', margin: 'auto 0' }}>
            No messages yet. Be the first!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              {/* Initials avatar — pink for all users (no role field) */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}>
                {getInitial(msg.displayName)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pink)' }}>{msg.displayName}</span>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input pill + send button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!user}
          placeholder={user ? 'Say something...' : 'Log in to chat'}
          maxLength={200}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '8px 14px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
            opacity: user ? 1 : 0.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!user || !input.trim()}
          style={{
            background: 'var(--pink)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            cursor: user && input.trim() ? 'pointer' : 'not-allowed',
            opacity: user && input.trim() ? 1 : 0.4,
            transition: 'opacity 0.15s',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
