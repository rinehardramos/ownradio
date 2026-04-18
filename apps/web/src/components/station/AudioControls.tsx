"use client";

import { useRef, useState, useEffect } from "react";

interface AudioControlsProps {
  streamUrl: string;
  isActive: boolean;
}

export function AudioControls({ streamUrl, isActive }: AudioControlsProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive) {
      audio.play().catch((err) => {
        console.log("Audio play failed (stream may be unavailable):", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isActive]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.log("Audio play failed (stream may be unavailable):", err);
        setIsPlaying(false);
      });
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) audio.volume = newVolume;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Volume down */}
      <button
        onClick={() => setVolume((v) => Math.max(0, v - 0.1))}
        aria-label="Volume down"
        className="text-white/60 hover:text-white transition-colors text-lg"
      >
        🔈
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleVolumeChange}
        aria-label="Volume"
        className="flex-1 accent-brand-pink h-1"
      />

      {/* Volume up */}
      <button
        onClick={() => setVolume((v) => Math.min(1, v + 0.1))}
        aria-label="Volume up"
        className="text-white/60 hover:text-white transition-colors text-lg"
      >
        🔊
      </button>

      {/* Play/pause */}
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="w-14 h-14 rounded-full bg-brand-pink flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="white"
            style={{ marginLeft: 2 }}
          >
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
