'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { createStationProgram } from '../../lib/api';

const DURATION_PRESETS = [
  { label: '30 min', secs: 1800 },
  { label: '1 hr', secs: 3600 },
  { label: '2 hr', secs: 7200 },
  { label: '3 hr', secs: 10800 },
];

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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !scheduledAt) {
      setError('Title and schedule time are required');
      return;
    }

    setSubmitting(true);
    try {
      await createStationProgram(stationSlug, {
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationSecs,
        description: description.trim() || undefined,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program');
    } finally {
      setSubmitting(false);
    }
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
        {submitting ? 'Scheduling...' : 'Schedule Show'}
      </button>
    </form>
  );
}
