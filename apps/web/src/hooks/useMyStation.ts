'use client';

import { useState, useCallback } from 'react';
import { getUserStations, getStationReadiness, type ReadinessCheck } from '../lib/api';
import type { OwnedStation } from '@ownradio/shared';

export type WizardStep = 'station' | 'dj' | 'program' | 'readiness';

export interface MyStationState {
  station: OwnedStation | null;
  readiness: ReadinessCheck | null;
  loading: boolean;
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  refresh: () => Promise<void>;
}

export function useMyStation(): MyStationState {
  const [station, setStation] = useState<OwnedStation | null>(null);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState<WizardStep>('station');
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const stations = await getUserStations();
      const first = Array.isArray(stations) && stations.length > 0 ? stations[0] as OwnedStation : null;
      setStation(first);

      if (first?.slug) {
        const check = await getStationReadiness(first.slug);
        setReadiness(check);

        if (!check.station) setWizardStep('station');
        else if (!check.dj) setWizardStep('dj');
        else if (!check.program) setWizardStep('program');
        else setWizardStep('readiness');
      }
    } catch {
      setStation(null);
      setReadiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on first render without useEffect + setState pattern
  if (!initialized) {
    setInitialized(true);
    refresh();
  }

  return { station, readiness, loading, wizardStep, setWizardStep, refresh };
}
