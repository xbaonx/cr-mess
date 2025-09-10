import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ApiToken, getTokens } from '@utils/api';

type Props = {
  label?: string;
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  excludeSymbols?: string[]; // symbols to exclude from selection
};

export default function TokenPicker({ label = 'Token', value, onChange, placeholder = 'Select token', excludeSymbols = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [debounced, setDebounced] = useState('');

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const list = await getTokens({ q: debounced || undefined, limit: 300 });
        if (!cancelled) setTokens(list);
      } catch {
        if (!cancelled) setTokens([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const excludeSet = useMemo(() => new Set(excludeSymbols.map(s => s.toUpperCase())), [excludeSymbols]);
  const filteredTokens = useMemo(() => tokens.filter(t => !excludeSet.has(t.symbol.toUpperCase())), [tokens, excludeSet]);
  const selected = useMemo(() => tokens.find((t) => t.symbol.toUpperCase() === value.toUpperCase()) || null, [tokens, value]);

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="label">{label}</label>}
      <button
        type="button"
        className="input flex items-center justify-between"
        onClick={() => setOpen((s: boolean) => !s)}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
          <div className="p-2">
            <input
              className="input"
              placeholder="Search by symbol or name"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-400">Loading...</div>
            ) : (
              filteredTokens.map((t: ApiToken) => (
                <button
                  key={t.address}
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center justify-between ${t.symbol.toUpperCase() === value.toUpperCase() ? 'bg-amber-900/20' : ''}`}
                  onClick={() => {
                    onChange(t.symbol.toUpperCase());
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold">
                      {t.symbol.slice(0, 4).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{t.symbol}</div>
                      <div className="text-xs text-gray-400">{t.name}</div>
                    </div>
                  </div>
                  {t.symbol.toUpperCase() === value.toUpperCase() && (
                    <span className="text-amber-400 text-sm">✓</span>
                  )}
                </button>
              ))
            )}
            {!loading && filteredTokens.length === 0 && (
              <div className="p-3 text-sm text-gray-400">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
