'use client';

import { X } from 'lucide-react';

const AVAILABLE_LANGUAGES = [
  { code: 'fil', label: 'Filipino' },
  { code: 'en', label: 'English' },
  { code: 'ceb', label: 'Cebuano' },
  { code: 'ilo', label: 'Ilocano' },
  { code: 'hil', label: 'Hiligaynon' },
  { code: 'war', label: 'Waray' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'es', label: 'Spanish' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

export interface LangEntry {
  code: string;
  weight: number;
}

interface LanguageSliderProps {
  languages: LangEntry[];
  onChange: (langs: LangEntry[]) => void;
}

function rebalance(langs: LangEntry[]): LangEntry[] {
  if (langs.length === 0) return [];
  const evenWeight = 1 / langs.length;
  return langs.map((l) => ({ ...l, weight: evenWeight }));
}

export function LanguageSlider({ languages, onChange }: LanguageSliderProps) {
  function addLanguage(code: string) {
    if (languages.some((l) => l.code === code)) return;
    const newLangs = [...languages, { code, weight: 0 }];
    onChange(rebalance(newLangs));
  }

  function removeLanguage(code: string) {
    const filtered = languages.filter((l) => l.code !== code);
    onChange(rebalance(filtered));
  }

  function setWeight(code: string, weight: number) {
    const clamped = Math.max(0, Math.min(1, weight));
    const others = languages.filter((l) => l.code !== code);
    const othersTotal = others.reduce((sum, l) => sum + l.weight, 0);
    const remaining = 1 - clamped;

    const updated = languages.map((l) => {
      if (l.code === code) return { ...l, weight: clamped };
      if (othersTotal === 0) return { ...l, weight: remaining / others.length };
      return { ...l, weight: (l.weight / othersTotal) * remaining };
    });
    onChange(updated);
  }

  const available = AVAILABLE_LANGUAGES.filter((l) => !languages.some((s) => s.code === l.code));

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-white/70">
        Languages <span className="text-white/30">(drag sliders to set mix)</span>
      </label>

      {languages.map((lang) => {
        const info = AVAILABLE_LANGUAGES.find((l) => l.code === lang.code);
        const pct = Math.round(lang.weight * 100);
        return (
          <div key={lang.code} className="flex items-center gap-3">
            <span className="text-sm text-white/70 w-20 shrink-0 truncate">
              {info?.label ?? lang.code}
            </span>

            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={100}
                value={pct}
                onChange={(e) => setWeight(lang.code, Number(e.target.value) / 100)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing"
                style={{
                  background: `linear-gradient(to right, var(--pink) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                  touchAction: 'pan-y',
                }}
              />
            </div>

            <span className="text-sm text-white/50 w-10 text-right tabular-nums">
              {pct}%
            </span>

            <button
              type="button"
              onClick={() => removeLanguage(lang.code)}
              className="p-1 rounded-full hover:bg-white/10 text-white/30 hover:text-white/60
                transition-colors active:scale-90"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {available.slice(0, 6).map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => addLanguage(lang.code)}
              className="px-3 py-1.5 rounded-full text-xs text-white/40 bg-white/5
                hover:bg-white/10 active:scale-95 transition-all"
            >
              + {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
