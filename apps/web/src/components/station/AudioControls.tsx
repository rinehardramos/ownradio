'use client';
import { forwardRef, useImperativeHandle, useState, useCallback, useRef, useEffect } from 'react';
import Hls from 'hls.js';

export interface AudioControlsHandle {
  isPlaying: boolean;
  volume: number;
  togglePlay: () => void;
  setVolume: (v: number) => void;
}

interface AudioControlsProps {
  streamUrl: string;
  onPlayStateChange?: (playing: boolean) => void;
  onVolumeChange?: (volume: number) => void;
}

export const AudioControls = forwardRef<AudioControlsHandle, AudioControlsProps>(
  function AudioControls({ streamUrl, onPlayStateChange, onVolumeChange }, ref) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(0.8);
    const [streamError, setStreamError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    // HLS.js setup for .m3u8 streams (Chrome/Firefox)
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      setStreamError(null);

      const isHls = streamUrl.endsWith('.m3u8');

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('[HLS] Manifest loaded, ready to play');
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('[HLS] Error:', data.type, data.details);
          if (data.fatal) {
            if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
                data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR) {
              setStreamError('Stream unavailable');
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }
          }
        });
        hlsRef.current = hls;
      } else if (isHls && audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        audio.src = streamUrl;
      } else {
        // Direct stream (Icecast, etc.)
        audio.src = streamUrl;
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [streamUrl, onPlayStateChange]);

    // NOTE: No isActive-triggered autoplay — audio only plays on explicit user click
    // to comply with browser autoplay policies (NotAllowedError).

    const togglePlay = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        audio.play().then(() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }).catch((err) => {
          console.warn('[Audio] play() rejected:', err);
        });
      }
    }, [isPlaying, onPlayStateChange]);

    const setVolume = useCallback((v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      if (audioRef.current) audioRef.current.volume = clamped;
      onVolumeChange?.(clamped);
    }, [onVolumeChange]);

    useImperativeHandle(ref, () => ({ isPlaying, volume, togglePlay, setVolume }), [isPlaying, volume, togglePlay, setVolume]);

    if (streamError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
          <span style={{ fontSize: '18px' }}>📡</span>
          <span>{streamError}</span>
        </div>
      );
    }

    const pct = Math.round(volume * 100);
    const sliderBg = `linear-gradient(to right, var(--pink) 0%, var(--pink) ${pct}%, var(--border-medium) ${pct}%, var(--border-medium) 100%)`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <audio
          ref={audioRef}
          preload="none"
          onPlay={() => { setIsPlaying(true); onPlayStateChange?.(true); }}
          onPause={() => { setIsPlaying(false); onPlayStateChange?.(false); }}
          onEnded={() => { setIsPlaying(false); onPlayStateChange?.(false); }}
        />
        <button
          onClick={() => setVolume(volume - 0.1)}
          aria-label="Volume down"
          className="btn-press"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}
        >
          🔉
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="Volume"
          style={{ flex: 1, background: sliderBg }}
        />
        <button
          onClick={() => setVolume(volume + 0.1)}
          aria-label="Volume up"
          className="btn-press"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}
        >
          🔊
        </button>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="play-btn-glow"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, var(--pink) 0%, var(--pink-light) 100%)',
            boxShadow: '0 4px 16px rgba(255,45,120,0.4)',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);
