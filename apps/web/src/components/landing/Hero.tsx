interface HeroProps {
  stationCount: number;
  listenerCount: number;
  djCount: number;
  liveCount: number;
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function Hero({ stationCount, listenerCount, djCount, liveCount }: HeroProps) {
  return (
    <section className="w-full bg-brand-dark px-6 py-14 text-center">
      {/* Animated radio icon */}
      <div className="mb-6 flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="h-16 w-16 animate-pulse"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="28" fill="#ff2d78" opacity="0.15" />
          <circle cx="32" cy="32" r="18" fill="#ff2d78" opacity="0.3" />
          <circle cx="32" cy="32" r="9" fill="#ff2d78" />
          <line x1="32" y1="4" x2="50" y2="14" stroke="#ff6b9d" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Title */}
      <h1
        className="font-sans text-5xl font-extrabold uppercase tracking-widest"
        style={{
          background: "linear-gradient(135deg, #ff2d78 0%, #ff6b9d 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        OwnRadio
      </h1>

      {/* Tagline */}
      <p className="mt-3 text-lg text-white/70">
        Your station, your vibe. Listen live.
      </p>

      {/* Stats */}
      <div className="mt-8 flex justify-center gap-8 flex-wrap">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: 'var(--pink)' }}>{stationCount}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Stations</span>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: '#22c55e' }}>{liveCount}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Live Now</span>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: 'var(--pink)' }}>{fmt(listenerCount)}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Listeners</span>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: 'var(--pink)' }}>{djCount}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider mt-1">DJs</span>
        </div>
      </div>
    </section>
  );
}
