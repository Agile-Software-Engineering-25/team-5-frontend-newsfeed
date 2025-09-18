import React, { useEffect, useMemo, useState } from 'react';

export type DatePreset = 'all' | '7d' | '30d' | 'custom';

export type FilterState = {
  search: string;
  datePreset: DatePreset;
  from?: string; // ISO YYYY-MM-DD (nur bei custom)
  to?: string; // ISO YYYY-MM-DD (nur bei custom)
  page: number; // 1-basiert
  pageSize: number; // Standard 10
};

export type FilterBarProps = {
  initial?: Partial<FilterState>;
  onChange?: (state: FilterState, query: string) => void; // callback bei jeder Änderung
  pageSizeOptions?: number[]; // z.B. [10, 20, 50]
};

// eslint-disable-next-line react-refresh/only-export-components,func-style
export function buildQuery(state: FilterState): string {
  const params = new URLSearchParams();

  if (state.search.trim()) params.set('query', state.search.trim());

  // Datum: bei Presets rechnen wir from/to auf Client-Seite
  if (state.datePreset === '7d') {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    params.set('from', from.toISOString());
    params.set('to', to.toISOString());
  } else if (state.datePreset === '30d') {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    params.set('from', from.toISOString());
    params.set('to', to.toISOString());
  } else if (state.datePreset === 'custom') {
    if (state.from) params.set('from', state.from);
    if (state.to) params.set('to', state.to);
  }

  params.set('page', String(state.page));
  params.set('pageSize', String(state.pageSize));

  return params.toString();
}

const defaultState: FilterState = {
  search: '',
  datePreset: 'all',
  from: undefined,
  to: undefined,
  page: 1,
  pageSize: 10,
};

const FilterBar: React.FC<FilterBarProps> = ({
  initial,
  onChange,
  pageSizeOptions = [10, 20, 50],
}) => {
  const [state, setState] = useState<FilterState>({
    ...defaultState,
    ...initial,
  });

  // Query-String memoisieren
  const queryString = useMemo(() => buildQuery(state), [state]);

  // Änderungen nach außen geben
  useEffect(() => {
    onChange?.(state, queryString);
  }, [state, queryString, onChange]);

  // Helpers
  const resetSearch = () => setState((s) => ({ ...s, search: '', page: 1 }));
  const clearDate = () =>
    setState((s) => ({
      ...s,
      datePreset: 'all',
      from: undefined,
      to: undefined,
      page: 1,
    }));

  const setPreset = (preset: DatePreset) =>
    setState((s) => ({
      ...s,
      datePreset: preset,
      // custom Felder zurücksetzen, wenn kein custom
      ...(preset !== 'custom' ? { from: undefined, to: undefined } : {}),
      page: 1,
    }));

  const setCustomFrom = (v: string) =>
    setState((s) => ({ ...s, datePreset: 'custom', from: v, page: 1 }));
  const setCustomTo = (v: string) =>
    setState((s) => ({ ...s, datePreset: 'custom', to: v, page: 1 }));

  // Pagination
  const nextPage = () => setState((s) => ({ ...s, page: s.page + 1 }));
  const prevPage = () =>
    setState((s) => ({ ...s, page: Math.max(1, s.page - 1) }));
  const setPage = (p: number) =>
    setState((s) => ({ ...s, page: Math.max(1, p) }));
  const setPageSize = (n: number) =>
    setState((s) => ({ ...s, pageSize: n, page: 1 }));

  // Anzeige der aktiven Filter-Chips
  const chips = useMemo(() => {
    const out: { label: string; onRemove: () => void }[] = [];
    if (state.search.trim()) {
      out.push({
        label: `Suche: "${state.search.trim()}"`,
        onRemove: resetSearch,
      });
    }
    if (state.datePreset === '7d') {
      out.push({ label: 'Datum: letzte 7 Tage', onRemove: clearDate });
    } else if (state.datePreset === '30d') {
      out.push({ label: 'Datum: letzte 30 Tage', onRemove: clearDate });
    } else if (state.datePreset === 'custom' && (state.from || state.to)) {
      out.push({
        label: `Datum: ${state.from ?? '…'} bis ${state.to ?? '…'} `,
        onRemove: clearDate,
      });
    }
    return out;
  }, [state.search, state.datePreset, state.from, state.to]);

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
      }}
    >
      {/* Zeile 1: Suche + Presets */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={state.search}
          onChange={(e) =>
            setState((s) => ({ ...s, search: e.target.value, page: 1 }))
          }
          placeholder="Suche in Titel & Inhalt…"
          style={{ padding: 8, minWidth: 240 }}
        />

        <select
          value={state.datePreset}
          onChange={(e) => setPreset(e.target.value as DatePreset)}
          style={{ padding: 8 }}
        >
          <option value="all">Alle Daten</option>
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="custom">Benutzerdefiniert…</option>
        </select>

        {state.datePreset === 'custom' && (
          <>
            <input
              type="date"
              value={state.from ?? ''}
              onChange={(e) => setCustomFrom(e.target.value)}
              style={{ padding: 8 }}
            />
            <input
              type="date"
              value={state.to ?? ''}
              onChange={(e) => setCustomTo(e.target.value)}
              style={{ padding: 8 }}
            />
          </>
        )}

        {/* PageSize */}
        <label style={{ marginLeft: 'auto' }}>
          Seite:
          <input
            type="number"
            min={1}
            value={state.page}
            onChange={(e) => setPage(Number(e.target.value || 1))}
            style={{ width: 64, marginLeft: 8, padding: 6 }}
          />
        </label>

        <label>
          pro Seite:
          <select
            value={state.pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ marginLeft: 8, padding: 6 }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button onClick={prevPage} disabled={state.page <= 1}>
          ← Zurück
        </button>
        <button onClick={nextPage}>Weiter →</button>
      </div>

      {/* Zeile 2: Aktive Filter-Chips */}
      {chips.length > 0 && (
        <div
          style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          {chips.map((c, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#f0f2f5',
                border: '1px solid #d9d9d9',
                borderRadius: 16,
                padding: '4px 10px',
              }}
            >
              {c.label}
              <button
                onClick={c.onRemove}
                aria-label="Filter entfernen"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Debug/Dev: Query-Anzeige */}
      <div
        style={{
          marginTop: 10,
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#555',
        }}
      >
        ?{queryString}
      </div>
    </div>
  );
};

export default FilterBar;
