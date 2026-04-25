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
  stationSlug?: string;
  autoPlay?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onVolumeChange?: (volume: number) => void;
}

// ── localStorage helpers for resume ─────────────────────────────────────────

const POSITION_KEY_PREFIX = 'ownradio:pos:';
const POSITION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SavedPosition {
  streamUrl: string;
  time: number;
  savedAt: number;
}

function savePosition(slug: string, streamUrl: string, time: number) {
  try {
    const data: SavedPosition = { streamUrl, time, savedAt: Date.now() };
    localStorage.setItem(`${POSITION_KEY_PREFIX}${slug}`, JSON.stringify(data));
  } catch { /* localStorage full or unavailable */ }
}

function loadPosition(slug: string, streamUrl: string): number | null {
  try {
    const raw = localStorage.getItem(`${POSITION_KEY_PREFIX}${slug}`);
    if (!raw) return null;
    const data: SavedPosition = JSON.parse(raw);
    if (data.streamUrl !== streamUrl) return null;
    if (Date.now() - data.savedAt > POSITION_MAX_AGE_MS) return null;
    return data.time;
  } catch {
    return null;
  }
}

function clearPosition(slug: string) {
  try { localStorage.removeItem(`${POSITION_KEY_PREFIX}${slug}`); } catch {}
}

// ── Time formatting ─────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Component ───────────────────────────────────────────────────────────────

export const AudioControls = forwardRef<AudioControlsHandle, AudioControlsProps>(
  function AudioControls({ streamUrl, stationSlug, autoPlay = false, onPlayStateChange, onVolumeChange }, ref) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(0.8);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resumedRef = useRef(false);

    // Slug for localStorage key (fall back to URL-based key)
    const slug = stationSlug || streamUrl.replace(/[^a-z0-9]/gi, '-').slice(0, 40);

    // HLS.js setup
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      // Stop current playback and clean up
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      onPlayStateChange?.(false);
      resumedRef.current = false;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }

      setStreamError(null);

      const isHls = streamUrl.endsWith('.m3u8');

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 600,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          fragLoadingTimeOut: 30000,
          fragLoadingMaxRetry: 3,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Restore saved position after manifest is ready
          const saved = loadPosition(slug, streamUrl);
          if (saved != null && saved > 0) {
            audio.currentTime = saved;
            resumedRef.current = true;
          }
          // Auto-play if user was already listening before navigating
          if (autoPlay) {
            audio.play().catch((err) => {
              console.warn('[Audio] auto-play rejected (browser policy):', err);
            });
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
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
        audio.src = streamUrl;
        audio.addEventListener('loadedmetadata', () => {
          const saved = loadPosition(slug, streamUrl);
          if (saved != null && saved > 0) {
            audio.currentTime = saved;
            resumedRef.current = true;
          }
          if (autoPlay) {
            audio.play().catch((err) => {
              console.warn('[Audio] auto-play rejected (browser policy):', err);
            });
          }
        }, { once: true });
      } else {
        audio.src = streamUrl;
        if (autoPlay) {
          audio.addEventListener('canplay', () => {
            audio.play().catch((err) => {
              console.warn('[Audio] auto-play rejected (browser policy):', err);
            });
          }, { once: true });
        }
      }

      // Save position every 5 seconds during playback
      saveIntervalRef.current = setInterval(() => {
        if (audio && !audio.paused && isFinite(audio.currentTime) && audio.currentTime > 0) {
          savePosition(slug, streamUrl, audio.currentTime);
        }
      }, 5000);

      return () => {
        // Save final position on unmount
        if (audio && isFinite(audio.currentTime) && audio.currentTime > 0) {
          savePosition(slug, streamUrl, audio.currentTime);
        }
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current);
          saveIntervalRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streamUrl, autoPlay]);

    // Track currentTime and duration for progress bar
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const onTimeUpdate = () => setCurrentTime(audio.currentTime);
      const onDurationChange = () => {
        if (isFinite(audio.duration)) setDuration(audio.duration);
      };
      const onEnded = () => {
        clearPosition(slug);
        setIsPlaying(false);
        onPlayStateChange?.(false);
      };

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('durationchange', onDurationChange);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('durationchange', onDurationChange);
        audio.removeEventListener('ended', onEnded);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streamUrl]);

    const togglePlay = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        savePosition(slug, streamUrl, audio.currentTime);
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
    }, [isPlaying, onPlayStateChange, slug, streamUrl]);

    const setVolume = useCallback((v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      if (audioRef.current) audioRef.current.volume = clamped;
      onVolumeChange?.(clamped);
    }, [onVolumeChange]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio || !isFinite(duration) || duration <= 0) return;
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      savePosition(slug, streamUrl, newTime);
    }, [duration, slug, streamUrl]);

    useImperativeHandle(ref, () => ({ isPlaying, volume, togglePlay, setVolume }), [isPlaying, volume, togglePlay, setVolume]);

    if (streamError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
          <span style={{ fontSize: '18px' }}>📡</span>
          <span>{streamError}</span>
        </div>
      );
    }

    const showProgress = isFinite(duration) && duration > 0;
    const progressPct = showProgress ? (currentTime / duration) * 100 : 0;
    const progressBg = `linear-gradient(to right, var(--pink) 0%, var(--pink) ${progressPct}%, var(--border-medium) ${progressPct}%, var(--border-medium) 100%)`;

    const volPct = Math.round(volume * 100);
    const volBg = `linear-gradient(to right, var(--pink) 0%, var(--pink) ${volPct}%, var(--border-medium) ${volPct}%, var(--border-medium) 100%)`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Progress bar */}
        {showProgress && (
          <div style={{ padding: '8px 16px 0' }}>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek"
              style={{ width: '100%', height: '4px', background: progressBg, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Controls: 3-column grid — volume cluster | play | spacer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '12px 16px' }}>
          <audio
            ref={audioRef}
            preload="none"
            onPlay={() => { setIsPlaying(true); onPlayStateChange?.(true); }}
            onPause={() => { setIsPlaying(false); onPlayStateChange?.(false); }}
          />

          {/* Volume cluster — left column */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setVolume(volume - 0.1)}
              aria-label="Volume down"
              className="btn-press"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', padding: 0 }}
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
              style={{ width: '72px', height: '3px', background: volBg, cursor: 'pointer' }}
            />
            <button
              onClick={() => setVolume(volume + 0.1)}
              aria-label="Volume up"
              className="btn-press"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', padding: 0 }}
            >
              🔊
            </button>
          </div>

          {/* Play button — center column */}
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

          {/* Right spacer — mirrors left column so play stays centered */}
          <div />
        </div>
      </div>
    );
  }
);
