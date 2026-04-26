'use client';

import { useMemo, type ReactNode } from 'react';
import { StepIndicator } from './StepIndicator';
import type { WizardStep } from '../../hooks/useMyStation';
import type { ReadinessCheck } from '../../lib/api';

interface WizardShellProps {
  currentStep: WizardStep;
  readiness: ReadinessCheck | null;
  onStepChange: (step: WizardStep) => void;
  children: ReactNode;
}

export function WizardShell({ currentStep, readiness, onStepChange, children }: WizardShellProps) {
  const completedSteps = useMemo(() => {
    const set = new Set<WizardStep>();
    if (readiness?.station) set.add('station');
    if (readiness?.dj) set.add('dj');
    if (readiness?.program) set.add('program');
    if (readiness?.status === 'on_air') set.add('readiness');
    return set;
  }, [readiness]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepChange}
      />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-10">
        {children}
      </div>
    </div>
  );
}
