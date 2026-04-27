'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { createStationProgram } from '../../lib/api';

const DURATION_PRESETS = [
  { label: '30 min', secs: 1800 },
  { label: '1 hr', secs: 3600 },
  { label: '2 hr', secs: 7200 },
  { label: '3 hr', secs: 10800 },
];

type PipelineStage = 'idle' | 'submitting' | 'generating' | 'ready' | 'error';

const PIPELINE_STEPS: { stage: PipelineStage; label: string }[] = [
  { stage: 'submitting', label: 'Submitting to PlayGen' },
  { stage: 'generating', label: 'Generating audio' },
  { stage: 'ready', label: 'Program ready' },
];

const STAGE_ORDER: PipelineStage[] = ['submitting', 'generating', 'ready'];

function stageIndex(s: PipelineStage) {
  return STAGE_ORDER.indexOf(s);
}

interface CreateProgramFormProps {
  stationSlug: string;
  onComplete: () => void;
}

export function CreateProgramForm({ stationSlug, onComplete }: CreateProgramFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationSecs, setDurationSecs] = useState(3600);
  const [error, setError] = useState('');
  const [pipeline, setPipeline] = useState<PipelineStage>('idle');

  const submitting = pipeline !== 'idle' && pipeline !== 'error';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !scheduledAt) {
      setError('Title and schedule time are required');
      return;
    }

    setPipeline('submitting');
    try {
      // Simulate brief visible "submitting" stage before the real API call resolves
      await createStationProgram(stationSlug, {
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationSecs,
        description: description.trim() || undefined,
      });

      // API call done — PlayGen is now generating
      setPipeline('generating');
      // Brief pause so the user sees the generating step, then mark ready
      await new Promise((r) => setTimeout(r, 1200));
      setPipeline('ready');
      await new Promise((r) => setTimeout(r, 800));
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program');
      setPipeline('error');
    }
  }

  // Show pipeline overlay once submitted
  if (pipeline !== 'idle' && pipeline !== 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-8 py-8 px-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}
        >
          <Calendar size={24} color="white" />
        </div>

        <div className="w-full max-w-xs space-y-4">
          {PIPELINE_STEPS.map((step, i) => {
            const currentIdx = stageIndex(pipeline);
            const stepIdx = i; // index in PIPELINE_STEPS (0,1,2) matches STAGE_ORDER
            const done = currentIdx > stepIdx;
            const active = currentIdx === stepIdx;

            return (
              <div key={step.stage} className="flex items-center gap-3">
                {/* Connector line above (skip first) */}
                <div className="flex flex-col items-center self-stretch">
                  {i > 0 && (
                    <div
                      className="w-px flex-1 mb-1 transition-colors duration-500"
                      style={{ background: done ? 'var(--pink)' : 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                  {done ? (
                    <CheckCircle2 size={22} color="var(--pink)" />
                  ) : active ? (
                    <Loader2 size={22} color="var(--pink)" className="animate-spin" />
                  ) : (
                    <Circle size={22} color="rgba(255,255,255,0.2)" />
                  )}
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div
                      className="w-px flex-1 mt-1 transition-colors duration-500"
                      style={{ background: done ? 'var(--pink)' : 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                </div>

                <span
                  className="text-sm font-medium transition-colors duration-300"
                  style={{
                    color: done
                      ? 'rgba(255,255,255,0.9)'
                      : active
                      ? '#fff'
                      : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-white/40 text-xs text-center max-w-[220px]">
          {pipeline === 'generating'
            ? 'PlayGen is composing your show — this may take a moment'
            : pipeline === 'ready'
            ? 'All done!'
            : 'Sending your show details to PlayGen...'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}
        >
          <Calendar size={24} color="white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Schedule a Show</h2>
        <p className="text-white/50 mt-1 text-sm">Set up your first program to go live</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Show Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Morning OPM Vibes"
          maxLength={80}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3.5 text-white placeholder-white/30
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Description <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Wake up to the best OPM hits..."
          rows={2}
          maxLength={300}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3 text-white placeholder-white/30 resize-none
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Start Time</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3.5 text-white
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base
            [color-scheme:dark]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Duration</label>
        <div className="flex gap-2">
          {DURATION_PRESETS.map((p) => (
            <button
              key={p.secs}
              type="button"
              onClick={() => setDurationSecs(p.secs)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95
                ${durationSecs === p.secs
                  ? 'text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              style={durationSecs === p.secs
                ? { background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }
                : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !scheduledAt}
        className="w-full py-3.5 rounded-xl font-semibold text-white text-base
          transition-all duration-200 active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}
      >
        Schedule Show
      </button>
    </form>
  );
}
