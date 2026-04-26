'use client';

import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

const POPULAR_CITIES = [
  'Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati',
  'Baguio', 'Iloilo', 'Bacolod', 'Cagayan de Oro', 'Zamboanga',
];

interface LocalePickerProps {
  selected: string[];
  onChange: (cities: string[]) => void;
  max?: number;
}

export function LocalePicker({ selected, onChange, max = 3 }: LocalePickerProps) {
  const [custom, setCustom] = useState('');

  function addCity(city: string) {
    const trimmed = city.trim();
    if (!trimmed || selected.length >= max || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setCustom('');
  }

  function removeCity(city: string) {
    onChange(selected.filter((c) => c !== city));
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/70">
        <MapPin size={14} className="inline mr-1" />
        Target Cities <span className="text-white/30">(up to {max})</span>
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((city) => (
            <span key={city} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5
              rounded-full text-sm text-white bg-white/10">
              {city}
              <button
                type="button"
                onClick={() => removeCity(city)}
                className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length < max && (
        <>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.filter((c) => !selected.includes(c)).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => addCity(city)}
                className="px-3 py-1.5 rounded-full text-sm text-white/50 bg-white/5
                  hover:bg-white/10 active:scale-95 transition-all"
              >
                + {city}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCity(custom))}
              placeholder="Other city..."
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl
                px-3 py-2.5 text-sm text-white placeholder-white/30
                focus:outline-none focus:border-[var(--pink)] transition-colors"
            />
            <button
              type="button"
              onClick={() => addCity(custom)}
              disabled={!custom.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white
                bg-white/10 hover:bg-white/15 disabled:opacity-30 transition-all active:scale-95"
            >
              Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}
