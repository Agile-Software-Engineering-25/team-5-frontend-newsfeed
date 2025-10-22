import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button as JoyButton } from '@mui/joy';
import newPostStyles from '../Newspost/Newspost.module.css';

export type DatePreset = 'all' | '7d' | '30d' | 'custom';

export type FilterState = {
  search: string;
  datePreset: DatePreset;
  from?: string; // ISO YYYY-MM-DD (nur bei custom)
  to?: string; // ISO YYYY-MM-DD (nur bei custom)
  page: number; // 1-basiert
  pageSize: number; // Standard 6
};

export type FilterBarProps = {
  initial?: Partial<FilterState>;
  onChange?: (state: FilterState, query: string) => void; // callback bei jeder Änderung
  pageSizeOptions?: number[]; // z.B. [6, 20, 50]
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
    params.set('from', from.toISOString().slice(0, 6));
    params.set('to', to.toISOString().slice(0, 6));
  } else if (state.datePreset === '30d') {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    params.set('from', from.toISOString().slice(0, 6));
    params.set('to', to.toISOString().slice(0, 6));
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
  pageSize: 6,
};

const FilterBar: React.FC<FilterBarProps> = ({
  initial,
  onChange,
  pageSizeOptions = [6, 20, 50],
}) => {
  const [state, setState] = useState<FilterState>({
    ...defaultState,
    ...initial,
  });

  // Dropdown open state + refs (für Datumspreset + PageSize)
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!dateOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateOpen]);

  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!pageSizeOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setPageSizeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pageSizeOpen]);

  // optional: dynamisch die Search-Komponente aus dem shared-package laden
  const [AgileSearch, setAgileSearch] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import('@agile-software/shared-components')
      .then((mod) => {
        if (!mounted) return;
        // mögliche Export-Namen abdecken
        const Comp =
          mod.SearchBar ||
          mod.Search ||
          mod.default?.SearchBar ||
          mod.default?.Search ||
          null;
        if (Comp) setAgileSearch(() => Comp);
      })
      .catch(() => {
        // still fallback to native input
      });
    return () => {
      mounted = false;
    };
  }, []);

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
        background: '#e3edf9',
        border: '1px solid #ddd',
        borderRadius: 12,
        padding: 15,
        marginBottom: 16,
        width: '1390px',      /* feste Breite */
        margin: '0 auto',     /* zentrieren */
        
      }}
    >
      {/* Zeile 1: Suche + Presets */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {AgileSearch ? (
          <AgileSearch
            value={state.search}
            onChange={(v: any) => {
              // die Agile-Komponente kann entweder ein Event oder den String liefern
              if (typeof v === 'string') {
                setState((s) => ({ ...s, search: v, page: 1 }));
              } else if (v && typeof v.target?.value === 'string') {
                setState((s) => ({ ...s, search: v.target.value, page: 1 }));
              } else if (v && typeof v.value === 'string') {
                setState((s) => ({ ...s, search: v.value, page: 1 }));
              }
            }}
            placeholder="Suche in Titel & Inhalt…"
            // optional: falls die Komponente Props für styling/size unterstützt
            size="small"
            style={{ minWidth: 240 }}
          />
        ) : (
          <input
            value={state.search}
            onChange={(e) =>
              setState((s) => ({ ...s, search: e.target.value, page: 1 }))
            }
            placeholder="Suche in Titel & Inhalt…"
            style={{
              padding: 8,
              minWidth: 240,
              borderRadius: 6,
              border: '1px solid #ccc',
            }}
          />
        )}

        {/* Datum: ersetzt durch dropdown styled wie Newspost */}
        <div className={newPostStyles.dropdownWrap} ref={dateRef}>
          <label style={{ marginRight: 8 }}>Datum:</label>
          <div className={newPostStyles.customDropdown}>
            <button
              type="button"
              className={newPostStyles.dropdownBtn}
              onClick={() => setDateOpen((o) => !o)}
            >
              {state.datePreset === 'all'
                ? 'Alle Daten'
                : state.datePreset === '7d'
                ? 'Letzte 7 Tage'
                : state.datePreset === '30d'
                ? 'Letzte 30 Tage'
                : 'Benutzerdefiniert…'}
             <span style={{ marginLeft: 8 }}>▾</span>
            </button>
            {dateOpen && (
              <div className={newPostStyles.dropdownList}>
                <label
                  className={newPostStyles.dropdownItem}
                  onClick={() => {
                    setPreset('all');
                    setDateOpen(false);
                  }}
                >
                  Alle Daten
                </label>
                <label
                  className={newPostStyles.dropdownItem}
                  onClick={() => {
                    setPreset('7d');
                    setDateOpen(false);
                  }}
                >
                  Letzte 7 Tage
                </label>
                <label
                  className={newPostStyles.dropdownItem}
                  onClick={() => {
                    setPreset('30d');
                    setDateOpen(false);
                  }}
                >
                  Letzte 30 Tage
                </label>
                <label
                  className={newPostStyles.dropdownItem}
                  onClick={() => {
                    setPreset('custom');
                    setDateOpen(false);
                  }}
                >
                  Benutzerdefiniert…
                </label>
              </div>
            )}
          </div>
        </div>

        {state.datePreset === 'custom' && (
          <>
            <input
              type="date"
              value={state.from ?? ''}
              onChange={(e) => setCustomFrom(e.target.value)}
              style={{
                padding: 8,
                borderRadius: '6px',
                border: '1px solid #ccc',
              }}
            />
            <input
              type="date"
              value={state.to ?? ''}
              onChange={(e) => setCustomTo(e.target.value)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: '1px solid #ccc',
              }}
            />
          </>
        )}

        {/* Page Input bleibt, PageSize als Dropdown styled wie Newspost */}
        <label style={{ marginLeft: 'auto' }}>
          Seite:
          <input
            type="number"
            min={1}
            value={state.page}
            onChange={(e) => setPage(Number(e.target.value || 1))}
            style={{
              width: 64,
              marginLeft: 8,
              padding: 6,
              borderRadius: 6,
              border: '1px solid #ccc',
            }}
          />
        </label>

        <div ref={pageSizeRef} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>pro Seite:</label>
          <div className={newPostStyles.customDropdown}>
            <button
              type="button"
              className={newPostStyles.dropdownBtn}
              onClick={() => setPageSizeOpen((o) => !o)}
            >
              {state.pageSize}
             <span style={{ marginLeft: 8 }}>▾</span>
            </button>
            {pageSizeOpen && (
              <div className={newPostStyles.dropdownList}>
                {pageSizeOptions.map((n) => (
                  <label
                    key={n}
                    className={newPostStyles.dropdownItem}
                    onClick={() => {
                      setPageSize(n);
                      setPageSizeOpen(false);
                    }}
                  >
                    {n}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <JoyButton
          onClick={prevPage}
          disabled={state.page <= 1}

        >
          ← Zurück
        </JoyButton>
        <JoyButton
          onClick={nextPage}
        >
          Weiter →
        </JoyButton>
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
                borderRadius: 6,
                padding: '4px 6px',
              }}
            >
              {c.label}
              <JoyButton
                onClick={c.onRemove}
                aria-label="Filter entfernen"

              >
                ×
              </JoyButton>
            </span>
          ))}
        </div>
      )}

      {/* Debug/Dev: Query-Anzeige */}
      <div
        style={{
          marginTop: 6,
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
