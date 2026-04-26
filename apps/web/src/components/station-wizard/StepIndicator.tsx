'use client';

import { Check } from 'lucide-react';
import type { WizardStep } from '../../hooks/useMyStation';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'station', label: 'Station' },
  { key: 'dj', label: 'DJ' },
  { key: 'program', label: 'Program' },
  { key: 'readiness', label: 'Go Live' },
];

interface StepIndicatorProps {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  onStepClick: (step: WizardStep) => void;
}

export function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] py-4 px-4">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.key);
          const isActive = step.key === currentStep;
          const isPast = i < currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => (isCompleted || isPast) && onStepClick(step.key)}
                disabled={!isCompleted && !isPast && !isActive}
                className="flex flex-col items-center gap-1.5 min-w-[48px]"
              >
                <div
                  className={`w-10 h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center
                    text-sm font-semibold transition-all duration-300
                    ${isCompleted
                      ? 'bg-green-500 text-white scale-100'
                      : isActive
                        ? 'text-white ring-2 ring-offset-2 ring-offset-[var(--bg-primary)]'
                        : 'bg-white/10 text-white/40'
                    }`}
                  style={isActive && !isCompleted
                    ? { background: 'linear-gradient(135deg, var(--pink), #a855f7)' }
                    : undefined}
                >
                  {isCompleted ? <Check size={18} /> : i + 1}
                </div>

                <span className={`text-xs hidden sm:block ${
                  isActive ? 'text-white font-medium' : 'text-white/40'
                }`}>
                  {step.label}
                </span>
              </button>

              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300"
                  style={{
                    background: isPast || isCompleted
                      ? 'var(--pink)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
