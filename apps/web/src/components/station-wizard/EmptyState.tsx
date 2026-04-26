'use client';

import { Radio } from 'lucide-react';

interface EmptyStateProps {
  onGetStarted: () => void;
}

export function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, var(--pink), #a855f7)' }}
      >
        <Radio size={36} color="white" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Start Your Own Radio Station
      </h1>

      <p className="text-white/60 max-w-md mb-8 text-base md:text-lg">
        Create a station, give it a DJ personality, schedule your first show,
        and go live — all in a few minutes.
      </p>

      <button
        onClick={onGetStarted}
        className="px-8 py-3.5 rounded-full font-semibold text-white text-base
          transition-all duration-200 active:scale-95 hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, var(--pink), #a855f7)' }}
      >
        Get Started
      </button>
    </div>
  );
}
