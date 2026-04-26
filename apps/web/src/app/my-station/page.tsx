'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMyStation, type WizardStep } from '../../hooks/useMyStation';
import { EmptyState } from '../../components/station-wizard/EmptyState';
import { WizardShell } from '../../components/station-wizard/WizardShell';
import { CreateStationForm } from '../../components/station-wizard/CreateStationForm';
import { CreateDjForm } from '../../components/station-wizard/CreateDjForm';
import { CreateProgramForm } from '../../components/station-wizard/CreateProgramForm';
import { ReadinessChecklist } from '../../components/station-wizard/ReadinessChecklist';

export default function MyStationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { station, readiness, loading, wizardStep, setWizardStep, refresh } = useMyStation();
  const [showWizard, setShowWizard] = useState(false);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] px-6 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Sign in to continue</h1>
        <p className="text-white/50 text-sm">You need an account to create a station.</p>
      </div>
    );
  }

  if (!station && !showWizard) {
    return (
      <div className="bg-[var(--bg-primary)] min-h-screen">
        <EmptyState onGetStarted={() => setShowWizard(true)} />
      </div>
    );
  }

  const currentStep = station ? wizardStep : 'station';

  function handleStepComplete() {
    refresh();
  }

  function renderStep(step: WizardStep) {
    switch (step) {
      case 'station':
        return <CreateStationForm onComplete={handleStepComplete} />;
      case 'dj':
        return station?.slug
          ? <CreateDjForm stationSlug={station.slug} onComplete={handleStepComplete} />
          : null;
      case 'program':
        return station?.slug
          ? <CreateProgramForm stationSlug={station.slug} onComplete={handleStepComplete} />
          : null;
      case 'readiness':
        return readiness
          ? <ReadinessChecklist
              readiness={readiness}
              stationName={station?.name ?? 'Your Station'}
              onGoToStep={setWizardStep}
            />
          : null;
    }
  }

  return (
    <WizardShell
      currentStep={currentStep}
      readiness={readiness}
      onStepChange={setWizardStep}
    >
      {renderStep(currentStep)}
    </WizardShell>
  );
}
