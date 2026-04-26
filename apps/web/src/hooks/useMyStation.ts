'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserStations, getStationReadiness, type ReadinessCheck } from '../lib/api';

export type WizardStep = 'station' | 'dj' | 'program' | 'readiness';

export interface MyStationState {
  station: any | null;
  readiness: ReadinessCheck | null;
  loading: boolean;
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  refresh: () => Promise<void>;
}

export function useMyStation(): MyStationState {
  const [station, setStation] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState<WizardStep>('station');

  const refresh = useCallback(async () => {
    try {
      const stations = await getUserStations();
      const first = Array.isArray(stations) && stations.length > 0 ? stations[0] : null;
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

  useEffect(() => { refresh(); }, [refresh]);

  return { station, readiness, loading, wizardStep, setWizardStep, refresh };
}
