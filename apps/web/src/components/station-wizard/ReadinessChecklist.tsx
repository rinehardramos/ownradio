'use client';

import { useEffect, useState } from 'react';
import { Check, Circle, Radio } from 'lucide-react';
import type { ReadinessCheck } from '../../lib/api';

interface ReadinessChecklistProps {
  readiness: ReadinessCheck;
  stationName: string;
  onGoToStep: (step: 'station' | 'dj' | 'program') => void;
}

const CHECKS: { key: keyof Omit<ReadinessCheck, 'status'>; label: string; step: 'station' | 'dj' | 'program' }[] = [
  { key: 'station', label: 'Station created on PlayGen', step: 'station' },
  { key: 'dj', label: 'DJ profile configured', step: 'dj' },
  { key: 'program', label: 'First show scheduled', step: 'program' },
];

export function ReadinessChecklist({ readiness, stationName, onGoToStep }: ReadinessChecklistProps) {
  const isLive = readiness.status === 'on_air';
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isLive) {
      const t = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(t);
    }
  }, [isLive]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6
            transition-all duration-500 ${isLive ? 'scale-110' : ''}`}
          style={{
            background: isLive
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, var(--pink), #a855f7)',
          }}
        >
          <Radio size={36} color="white" />
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white">
          {isLive ? `${stationName} is Live!` : 'Almost There...'}
        </h2>
        <p className="text-white/50 mt-1 text-sm">
          {isLive
            ? 'Your station is now broadcasting'
            : 'Complete these steps to go live'}
        </p>
      </div>

      <div className="space-y-3">
        {CHECKS.map((check, i) => {
          const passed = readiness[check.key];
          return (
            <button
              key={check.key}
              type="button"
              onClick={() => !passed && onGoToStep(check.step)}
              disabled={passed}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                ${passed
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--pink)]/50 active:scale-[0.99]'
                }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                transition-all duration-500
                ${passed ? 'bg-green-500 scale-100' : 'bg-white/10'}`}>
                {passed
                  ? <Check size={16} color="white" />
                  : <Circle size={16} className="text-white/30" />
                }
              </div>

              <span className={`text-sm text-left ${passed ? 'text-white/60 line-through' : 'text-white'}`}>
                {check.label}
              </span>

              {!passed && (
                <span className="ml-auto text-xs text-[var(--pink)]">Set up</span>
              )}
            </button>
          );
        })}
      </div>

      {isLive && showConfetti && (
        <div className="text-center animate-[slide-up_0.5s_ease-out]">
          <p className="text-green-400 font-semibold text-lg mb-2">
            Your station is on air!
          </p>
          <p className="text-white/40 text-sm">
            Listeners can now find you in the station carousel.
          </p>
        </div>
      )}
    </div>
  );
}
