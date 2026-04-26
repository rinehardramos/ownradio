'use client';

import { useState } from 'react';
import { Radio } from 'lucide-react';
import { createUserStation } from '../../lib/api';

const GENRES = ['OPM', 'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Country', 'Reggae', 'Latin', 'K-Pop'];

interface CreateStationFormProps {
  onComplete: () => void;
}

export function CreateStationForm({ onComplete }: CreateStationFormProps) {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !genre) {
      setError('Station name and genre are required');
      return;
    }

    setSubmitting(true);
    try {
      await createUserStation({ name: name.trim(), genre, slug, description: description.trim() });
      onComplete();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create station');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, var(--pink), #a855f7)' }}
        >
          <Radio size={24} color="white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Name Your Station</h2>
        <p className="text-white/50 mt-1 text-sm">Choose a name and genre for your radio station</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Station Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Metro Manila Mix"
          maxLength={60}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3.5 text-white placeholder-white/30
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
        {slug && (
          <p className="text-white/30 text-xs mt-1.5">
            ownradio.net/station/<span className="text-white/50">{slug}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Genre</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                active:scale-95
                ${genre === g
                  ? 'text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              style={genre === g
                ? { background: 'linear-gradient(135deg, var(--pink), #a855f7)' }
                : undefined}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Description <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell listeners what your station is about..."
          rows={3}
          maxLength={300}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3 text-white placeholder-white/30 resize-none
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim() || !genre}
        className="w-full py-3.5 rounded-xl font-semibold text-white text-base
          transition-all duration-200 active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, var(--pink), #a855f7)' }}
      >
        {submitting ? 'Creating...' : 'Create Station'}
      </button>
    </form>
  );
}
