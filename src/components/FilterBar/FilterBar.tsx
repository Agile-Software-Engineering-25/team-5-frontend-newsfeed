import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button as JoyButton } from '@mui/joy';

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
  nextButtonVisible: boolean
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
    params.set('from', from.toISOString().slice(0, 10));
    params.set('to', to.toISOString().slice(0, 10));
  } else if (state.datePreset === '30d') {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    params.set('from', from.toISOString().slice(0, 10));
    params.set('to', to.toISOString().slice(0, 10));
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
                                               nextButtonVisible,
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
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
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
        const Comp = mod.SearchBar || mod.default?.SearchBar || null;
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
    <>
      <style>{`
        .filter-bar {
          background: #e3edf9;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 20px;
          
          width: 1500px;
          margin: 0 auto;
          box-sizing: border-box;
          text-align: center;
        }
        .filter-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }
        .chips-row {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
  .dropdown-wrapper { position: relative; min-width: 180px; }
  .page-size-wrapper { min-width: 120px; }
  .page-input { display: flex; align-items: center; gap: 8px; }
        .actions-inline { display: flex; gap: 8px; margin-left: auto; align-items: center; white-space: nowrap; }
  .filter-row input[type="date"], .filter-row input[type="number"] { max-width: 160px; flex: 0 0 auto; }
        /* medium breakpoint: slightly narrower than desktop */
        @media (max-width: 1500px) {
          .filter-bar { max-width: 1300px; }
        }
          @media (max-width: 1495px) {
          .filter-bar { max-width: 1000; }
        /* smaller screens: use percentage-based width */
        @media (max-width: 1315px) {
          .filter-bar { max-width: 80%; padding: 12px; }
        }
          @media (max-width: 1290px) {
          .filter-bar { max-width: 1034px }
       
     
      `}</style>

      <div className="filter-bar">
      {/* Zeile 1: Suche + Presets */}
      <div className="filter-row">
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

        {/* Datum: Dropdown (Inline-Styles statt CSS-Klassen) */}
        <div
          ref={dateRef}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <label style={{ marginRight: 8 }}>Datum:</label>
          <div style={{ position: 'relative', minWidth: 180 }}>
            <button
              type="button"
              onClick={() => setDateOpen((o) => !o)}
              style={{
                width: '100%',
                background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
                border: '1px solid rgba(16,24,40,0.08)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition:
                  'background 0.12s, border-color 0.12s, box-shadow 0.12s',
                boxShadow: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {state.datePreset === 'all'
                ? 'Gesamter Zeitraum'
                : state.datePreset === '7d'
                  ? 'Letzte 7 Tage'
                  : state.datePreset === '30d'
                    ? 'Letzte 30 Tage'
                    : 'Benutzerdefiniert…'}
              <span style={{ marginLeft: 8 }}>▾</span>
            </button>
            {dateOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '100%',
                  background: '#fff',
                  borderRadius: 6,
                  boxShadow: '0 6px 30px rgba(16,24,40,0.08)',
                  padding: '8px 8px',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  minWidth: 180,
                  border: '1px solid rgba(16,24,40,0.04)',
                }}
              >
                <label
                  onClick={() => {
                    setPreset('all');
                    setDateOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    padding: '8px 6px',
                    borderRadius: 6,
                    transition: 'background 0.12s, color 0.12s',
                    cursor: 'pointer',
                  }}
                >
                  Gesamter Zeitraum
                </label>
                <label
                  onClick={() => {
                    setPreset('7d');
                    setDateOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    padding: '8px 6px',
                    borderRadius: 6,
                    transition: 'background 0.12s, color 0.12s',
                    cursor: 'pointer',
                  }}
                >
                  Letzte 7 Tage
                </label>
                <label
                  onClick={() => {
                    setPreset('30d');
                    setDateOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    padding: '8px 6px',
                    borderRadius: 6,
                    transition: 'background 0.12s, color 0.12s',
                    cursor: 'pointer',
                  }}
                >
                  Letzte 30 Tage
                </label>
                <label
                  onClick={() => {
                    setPreset('custom');
                    setDateOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    padding: '8px 6px',
                    borderRadius: 6,
                    transition: 'background 0.12s, color 0.12s',
                    cursor: 'pointer',
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

        {/* Page Input bleibt, PageSize als Dropdown (Inline-Styles statt CSS-Klassen) */}
        <label>
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

        <div ref={pageSizeRef} className="page-input">
          <label>pro Seite:</label>
          <div className="dropdown-wrapper page-size-wrapper">
            <button
              type="button"
              onClick={() => setPageSizeOpen((o) => !o)}
              style={{
                width: '100%',
                background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
                border: '1px solid rgba(16,24,40,0.08)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition:
                  'background 0.12s, border-color 0.12s, box-shadow 0.12s',
                boxShadow: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {state.pageSize}
              <span style={{ marginLeft: 8 }}>▾</span>
            </button>
            {pageSizeOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '100%',
                  background: '#fff',
                  borderRadius: 6,
                  boxShadow: '0 6px 30px rgba(16,24,40,0.08)',
                  padding: '8px 8px',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  minWidth: 180,
                  border: '1px solid rgba(16,24,40,0.04)',
                }}
              >
                {pageSizeOptions.map((n) => (
                  <label
                    key={n}
                    onClick={() => {
                      setPageSize(n);
                      setPageSizeOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      padding: '8px 6px',
                      borderRadius: 6,
                      transition: 'background 0.12s, color 0.12s',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="actions-inline">
          <JoyButton onClick={prevPage} disabled={state.page <= 1}>
            ← Zurück
          </JoyButton>
          <JoyButton onClick={nextPage} disabled={nextButtonVisible}>Weiter →</JoyButton>
        </div>
      </div>

      {/* Zeile 2: Aktive Filter-Chips */}
      {chips.length > 0 && (
        <div className="chips-row">
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
              <JoyButton onClick={c.onRemove} aria-label="Filter entfernen">
                ×
              </JoyButton>
            </span>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default FilterBar;
