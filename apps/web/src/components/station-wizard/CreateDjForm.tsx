'use client';

import { useState, useEffect } from 'react';
import { Mic2 } from 'lucide-react';
import { createDjProfile, getTtsVoices, type TtsVoice } from '../../lib/api';
import { LocalePicker } from './LocalePicker';
import { LanguageSlider, type LangEntry } from './LanguageSlider';

interface CreateDjFormProps {
  stationSlug: string;
  onComplete: () => void;
}

export function CreateDjForm({ stationSlug, onComplete }: CreateDjFormProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [localeCities, setLocaleCities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<LangEntry[]>([
    { code: 'fil', weight: 0.5 },
    { code: 'en', weight: 0.5 },
  ]);
  const [personality, setPersonality] = useState('');
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [ttsVoiceId, setTtsVoiceId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTtsVoices().then(setVoices).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !bio.trim() || localeCities.length === 0 || languages.length === 0) {
      setError('Name, bio, at least one city, and at least one language are required');
      return;
    }

    setSubmitting(true);
    try {
      await createDjProfile({
        stationSlug,
        name: name.trim(),
        bio: bio.trim(),
        localeCities,
        languages,
        personality: personality.trim() || undefined,
        ttsVoiceId: ttsVoiceId || undefined,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DJ profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #a855f7, var(--pink))' }}
        >
          <Mic2 size={24} color="white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Create Your DJ</h2>
        <p className="text-white/50 mt-1 text-sm">Give your station a personality</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">DJ Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="DJ Camille"
          maxLength={40}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3.5 text-white placeholder-white/30
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Your friendly Taglish DJ spinning the best OPM hits..."
          rows={3}
          maxLength={300}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3 text-white placeholder-white/30 resize-none
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
      </div>

      <LocalePicker selected={localeCities} onChange={setLocaleCities} max={3} />

      <LanguageSlider languages={languages} onChange={setLanguages} />

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Personality <span className="text-white/30">(optional)</span>
        </label>
        <input
          type="text"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="Energetic, witty, loves to tell jokes..."
          maxLength={200}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
            px-4 py-3.5 text-white placeholder-white/30
            focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
        />
      </div>

      {voices.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Voice <span className="text-white/30">(optional)</span>
          </label>
          <select
            value={ttsVoiceId}
            onChange={(e) => setTtsVoiceId(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
              px-4 py-3.5 text-white
              focus:outline-none focus:border-[var(--pink)] transition-colors text-base"
          >
            <option value="">Auto-select</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.locale})</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim() || !bio.trim() || localeCities.length === 0}
        className="w-full py-3.5 rounded-xl font-semibold text-white text-base
          transition-all duration-200 active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #a855f7, var(--pink))' }}
      >
        {submitting ? 'Creating DJ...' : 'Create DJ Profile'}
      </button>
    </form>
  );
}
