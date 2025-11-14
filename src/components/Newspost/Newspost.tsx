import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Button as JoyButton, Checkbox as JoyCheckbox } from '@mui/joy';

import ReactQuill from 'react-quill';
import snowCss from 'react-quill/dist/quill.snow.css?inline';

import DOMPurify from 'dompurify';
import type {
  NewsPostCreate,
  NewsPostRead,
  NewsPostUpdate,
  Content as NewsContent,
} from '@/types/newsfeed';

type EditablePost = NewsPostRead | (Partial<NewsPostCreate> & { id: string });

type SavePayload = {
  post: NewsPostCreate | NewsPostUpdate;
};

type ChangePayload = {
  post: Partial<NewsPostCreate | NewsPostUpdate>;
};

type RemovePayload = { id: string };

interface NewsPostCardProps {
  /** Der Post (Read oder Create/Update-Entwurf) */
  post: EditablePost;

  postViewProp?: 'add' | 'edit' | 'show';

  /** Optionales UI-Tagging außerhalb des API-Schemas */
  department?: string;

  /** Schreibrechte/Buttons anzeigen */
  maintain?: boolean;

  /** Callbacks */
  onChange?: (data: ChangePayload) => void;
  onSave?: (data: SavePayload) => void;
  onCancel?: () => void;
  onRemove?: (data: RemovePayload) => void;
}

// Neue Rollen/Areas für den Dropdown (value = interne permission, label = Anzeige im UI)
const departmentOptions = [
  { value: 'Alle', label: 'Alle' },
  { value: 'student', label: 'Alle Studenten' },
  { value: 'lecturer', label: 'Alle Lehrkräfte' },
  { value: 'Area-2.Team-5.Read.NewsPost-Engineering', label: 'Studenten Engineering' },
  { value: 'Area-2.Team-5.Read.NewsPost-ComputerScience', label: 'Studenten Computer Science' },
  { value: 'Area-2.Team-5.Read.NewsPost-Business', label: 'Studenten Business' },
  { value: 'Area-2.Team-5.Read.NewsPost-Chemistry', label: 'Studenten Chemie' },
];

const ALL_TOKEN = 'Alle';
const STUDENT_TOKEN = 'student';
const LECTURER_TOKEN = 'lecturer';
// area-specific values that belong to the student-group
const areaValues = [
  'Area-2.Team-5.Read.NewsPost-Engineering',
  'Area-2.Team-5.Read.NewsPost-ComputerScience',
  'Area-2.Team-5.Read.NewsPost-Business',
  'Area-2.Team-5.Read.NewsPost-Chemistry',
];

// helpers: map value -> label and sort selected values into the fixed order
function valueToLabel(value: string) {
  const found = departmentOptions.find((o) => o.value === value);
  return found ? found.label : value;
}

function sortDepartments(values: string[]) {
  const order = departmentOptions.map((o) => o.value);
  const set = new Set(values);
  // preserve only known values and sort by index in departmentOptions
  return order.filter((v) => set.has(v));
}

const NewsPostCard: React.FC<NewsPostCardProps> = ({
                                                     post,
                                                     postViewProp = 'show',
                                                     department = 'Alle',
                                                     maintain,
                                                     onChange,
                                                     onSave,
                                                     onCancel,
                                                     onRemove,
                                                   }) => {
  // Initialwerte aus dem Post ableiten
  const initialTitle = post.title ?? '';
  const initialContent: NewsContent = post.content ?? {
    format: 'html',
    body: '',
  };
  const authorName = post.author?.name ?? 'Unbekannt';
  const dateIso = post.creation_date;

  // Lokaler Zustand
  const [localTitle, setLocalTitle] = useState<string>(initialTitle);
  const [localContent, setLocalContent] = useState<NewsContent>(initialContent);
  const [postView, setPostView] = useState<'add' | 'edit' | 'show'>(
    postViewProp
  );
  // Normalisiere initiales department prop: entweder 'Alle' oder gültige domain-roles (values)
  const domainValues = departmentOptions.map((d) => d.value).filter((v) => v !== ALL_TOKEN);
  const initialDepartments = useMemo(() => {
    if (!department) return ['Alle'];
    const parts = department.split(',').map((s) => s.trim());
    if (parts.includes('Alle')) return ['Alle'];
    const filtered = domainValues.filter((r) => parts.includes(r));
    return filtered.length === 0 ? ['Alle'] : filtered;
  }, [department]);

  const [localDepartment, setLocalDepartment] = useState<string[]>(initialDepartments);

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Quill
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ align: ['', 'center', 'right', 'justify'] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        [{ color: [] }, { background: [] }],
      ],
    }),
    []
  );
  const quillFormats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'bullet',
      'link',
      'image',
      'color',
      'background',
      'align',
      'size',
      'font',
    ],
    []
  );

  // Handlers
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setLocalTitle(next);
      onChange?.({
        post: { title: next },
      });
    },
    [onChange]
  );

  const handleContentChange = useCallback(
    (html: string) => {
      const next: NewsContent = { format: 'html', body: html };
      setLocalContent(next);
      onChange?.({
        post: { content: next },
      });
    },
    [onChange]
  );

  const handleCheckboxChange = (optionValue: string) => {
    // Toggle logic with grouping:
    // - ALL_TOKEN selects/deselects everything
    // - STUDENT_TOKEN represents the group of areaValues; selecting it removes individual areas and vice-versa
    const nextSet = new Set(localDepartment);

    if (optionValue === ALL_TOKEN) {
      if (nextSet.has(ALL_TOKEN)) {
        nextSet.clear();
      } else {
        nextSet.clear();
        // add ALL_TOKEN to represent 'all selected'
        nextSet.add(ALL_TOKEN);
      }
    } else if (optionValue === STUDENT_TOKEN) {
      // toggle student group
      if (nextSet.has(STUDENT_TOKEN)) {
        nextSet.delete(STUDENT_TOKEN);
      } else {
        // remove areaValues and add the STUDENT_TOKEN
        areaValues.forEach((v) => nextSet.delete(v));
        nextSet.delete(ALL_TOKEN);
        nextSet.add(STUDENT_TOKEN);
      }
    } else if (optionValue === LECTURER_TOKEN) {
      // simple toggle for lecturer
      if (nextSet.has(LECTURER_TOKEN)) nextSet.delete(LECTURER_TOKEN);
      else {
        nextSet.delete(ALL_TOKEN);
        nextSet.add(LECTURER_TOKEN);
      }
    } else {
      // option is an individual area
      if (nextSet.has(optionValue)) nextSet.delete(optionValue);
      else {
        // selecting an individual area should remove the STUDENT_TOKEN (group)
        nextSet.delete(STUDENT_TOKEN);
        nextSet.delete(ALL_TOKEN);
        nextSet.add(optionValue);
      }

      // If now all areaValues are selected individually, compress into STUDENT_TOKEN
      const hasAllAreas = areaValues.every((v) => nextSet.has(v));
      if (hasAllAreas) {
        // remove individual areas
        areaValues.forEach((v) => nextSet.delete(v));
        nextSet.add(STUDENT_TOKEN);
      }
    }

    // If both students and lecturers are selected, treat as ALL
    if (nextSet.has(STUDENT_TOKEN) && nextSet.has(LECTURER_TOKEN)) {
      nextSet.clear();
      nextSet.add(ALL_TOKEN);
    }

    // fallback: if nothing selected, use ALL_TOKEN for default
    if (nextSet.size === 0) nextSet.add(ALL_TOKEN);

    setLocalDepartment(Array.from(nextSet));
  };

  const buildPayload = useCallback((): NewsPostCreate | NewsPostUpdate => {
    return {
      // Pflichtfelder laut Schema
      id: post.id,
      title: localTitle.trim(),
      content: { format: 'html', body: localContent.body },
      author: post.author ?? { user_id: 'unknown', name: authorName },
      creation_date: post.creation_date ?? new Date().toISOString(),
      // Immer diese beiden Gruppen erlauben
      permissions: Array.from(
        new Set([
          'sau-admin',
          'university-administrative-staff',
          // Wenn ALL_TOKEN ausgewählt ist, fügen wir alle domainValues hinzu
          ...(localDepartment.includes(ALL_TOKEN) ? domainValues : localDepartment),
          // falls im post bereits permissions vorhanden sind (z.B. beim Edit), merge sie
          ...((post as NewsPostCreate).permissions ?? []),
        ].filter(Boolean))
      ),
    };
  }, [post, localTitle, localContent.body, authorName]);

  const handleSave = useCallback(() => {
    const payload = buildPayload();
    onSave?.({ post: payload });

    if (postView === 'add') {
      // reset inputs so admin can create another post without the component disappearing
      setLocalTitle('');
      setLocalContent({ format: 'html', body: '' });
      // keep the current selection but normalize/sort it for consistent display
      const sorted = sortDepartments(localDepartment);
      setLocalDepartment(sorted);
      // stay in 'add' mode
    } else {
      // For edits, show the saved post in read-mode
      const sorted = sortDepartments(localDepartment);
      setLocalDepartment(sorted);
      setPostView('show');
    }
  }, [buildPayload, onSave, postView, initialDepartments, localDepartment]);

  const handleEdit = useCallback(() => {
    const payload = buildPayload();
    onSave?.({ post: payload });
    const sorted = sortDepartments(localDepartment);
    setLocalDepartment(sorted);
    setPostView('show');
  }, [buildPayload, onSave]);

  const handleCancel = useCallback(() => {
    setPostView('show');
    setLocalTitle(initialTitle);
    setLocalContent(initialContent);
    onCancel?.();
  }, [initialContent, initialTitle, onCancel]);

  const handleRemove = useCallback(() => {
    onRemove?.({ id: post.id });
  }, [onRemove, post.id]);

  const safeHtml = useMemo(() => {
    // nur im View-Modus relevant (oder wenn wir HTML anzeigen)
    const html = localContent.format === 'html' ? localContent.body : '';
    return DOMPurify.sanitize(html || '');
  }, [localContent]);

  // Datumsformatierung (DD.MM.YYYY)
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    const regex = /^(\d{1,2})[.](\d{1,2})[.](\d{4})$/;
    const match = dateString.match(regex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${day}.${month}.${year}`;
    }
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return dateString;
  }

  const isTitleValid = Boolean(localTitle.trim());

  return (
    <>
      <style>{snowCss}

        {`
      .ql-editor {
        min-height: 200px;
        padding: 14px;
        line-height: 1.7;
        font-size: 17px;
      }

      /* Responsive adjustments */
      .news-article {
        width: 100%;
        max-width: 975px;
        min-height: 560px;
        margin: 28px auto;
        padding: 30px; /* reduce bottom padding a bit */
        padding-bottom: 0px;
        background: #e3edf9;
        border-radius: 12px;
        overflow: hidden;
        color: #1a1a1a;
        display: flex;
        flex-direction: column;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }

      .news-meta {
        display: flex;
        gap: 26px;
        font-size: 17px;
        color: rgba(0,0,0,0.6);
        margin-top: 10px;
        align-items: center;
      }

      .dropdown-list {
        min-width: 180px;
      }

      .actions-row {
        display: flex;
        gap: 14px;
        justify-content: flex-end;
        margin-top: 14px;
        margin-bottom: 8px; /* less space under the buttons */
        padding-right: 24px;
        padding-bottom: 8px;
      }

      @media (max-width: 600px) {
        .news-article {
          padding: 20px;
        }
        .news-article { max-width: 95%; }
        .ql-editor {
          font-size: 15px;
        }
        input[type="text"] {
          font-size: 18px;
        }
        .news-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        .dropdown-list {
          min-width: 140px;
          width: 100%;
        }
        .actions-row {
          flex-direction: column;
          align-items: stretch;
          padding-right: 0;
        }
        .actions-row button {
          width: 100%;
        }
      }
    `}
      </style>

    <article className="news-article"
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          padding: '16px 0px 24px 0px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {postView === 'edit' || postView === 'add' ? (
          <>
            <input
              /* .titleInput */
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '24px',
                fontWeight: 700,
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '6px 13px',
                outline: 'none',
              }}
              type="text"
              placeholder="Titel eingeben…"
              value={localTitle}
              onChange={handleTitleChange}
            />
            <div className="news-meta"
            >
              <span /* .author */ style={{ fontStyle: 'italic' }}>
                Von {authorName}
              </span>
              <div
                /* .dropdownWrap */
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <label>Fachbereich:&nbsp;</label>
                <div
                  /* .customDropdown */
                  style={{ position: 'relative', minWidth: '180px' }}
                  ref={dropdownRef}
                >
                  <JoyButton
                    type="button"
                    variant="outlined"
                    size="sm"
                    color="neutral"
                    onClick={() => setDropdownOpen((open) => !open)}
                    endDecorator={<span style={{ marginLeft: 8 }}>▾</span>}
                    sx={{
                      justifyContent: 'space-between',
                      borderRadius: '6px',
                      minWidth: '40px',
                    }}
                    style={{
                      width: '100%',
                      background:
                        'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
                      border: '1px solid rgba(16,24,40,0.08)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
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
                    {localDepartment.length > 0
                      ? // map stored values to labels for display
                        localDepartment
                          .map((v) => {
                            const found = departmentOptions.find((o) => o.value === v);
                            return found ? found.label : v;
                          })
                          .join(', ')
                      : 'Alle auswählen'}
                  </JoyButton>
                  {dropdownOpen && (
                      <div className="dropdown-list"
                        /* .dropdownList */
                        style={{
                          position: 'absolute',
                          top: '110%',
                          left: 0,
                          width: '100%',
                          background: '#fff',
                          borderRadius: '6px',
                          boxShadow: '0 6px 30px rgba(16,24,40,0.08)',
                          padding: '8px 8px',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          minWidth: '180px',
                          border: '1px solid rgba(16,24,40,0.04)',
                        }}
                      >
                      {departmentOptions.map((option) => (
                        <label
                          key={option.value}
                          /* .dropdownItem */
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '14px',
                            padding: '8px 6px',
                            borderRadius: '6px',
                            transition: 'background 0.12s, color 0.12s',
                          }}
                        >
                          <JoyCheckbox
                            checked={localDepartment.includes(option.value)}
                            onChange={() => handleCheckboxChange(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span /* .date */ style={{ fontWeight: 'bold' }}>
                {formatDate(dateIso || new Date().toISOString())}
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 /* .title (keine Styles definiert) */>
              {localTitle || '(ohne Titel)'}
            </h2>
            <div
              /* .meta */
              style={{
                display: 'flex',
                gap: '24px',
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.55)',
                marginTop: '8px',
                alignItems: 'center',
              }}
            >
              <span /* .author */ style={{ fontStyle: 'italic' }}>
                Von {authorName}
              </span>
              <span /* .date */ style={{ fontWeight: 'bold' }}>
                {formatDate(dateIso || new Date().toISOString())}
              </span>
              <span /* .department (keine eigenen Styles) */>
                Fachbereich: {sortDepartments(localDepartment).map(valueToLabel).join(', ')}
              </span>
            </div>
          </>
        )}
      </header>

      {postView === 'show' ? (
        <>
          {/* Anzeige: Quill-HTML sicher rendern */}
          <div
            /* .body */
            style={{
              padding: '32px',
              fontSize: '18px',
              lineHeight: '32px',
              color: '#333',
            }}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
          <div className="actions-row"
          >
            {maintain && (
              <>
                <JoyButton onClick={() => setPostView('edit')}>
                  Bearbeiten
                </JoyButton>
                <JoyButton onClick={handleRemove}>Entfernen</JoyButton>
              </>
            )}
          </div>
        </>
      ) : postView === 'add' ? (
        <>
          <div
            /* .editorWrap */
            style={{ marginTop: '24px', backgroundColor: '#fff', borderRadius: 6 }}
          >
            {/* Wir editieren in HTML (Quill) */}
            <ReactQuill
              style={{
                minHeight: '180px', /* <- Eingabefeld-Mindesthöhe */
                padding: '12px',
              }}
              theme="snow"
              modules={quillModules}
              formats={quillFormats}
              value={localContent.body}
              onChange={handleContentChange}
            />
          </div>

          {(onSave || onCancel) && (
            <div
              /* .actions */
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '20px',
                marginBottom: '16px',
                paddingRight: '24px',
                paddingBottom: '16px',
              }}
            >
              {onSave && (
                <JoyButton
                  onClick={handleSave}
                  disabled={!isTitleValid}
                  title={isTitleValid ? 'Speichern' : 'Titel darf nicht leer sein'}
                >
                  Speichern
                </JoyButton>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div
            /* .editorWrap */
            style={{ marginTop: '24px', backgroundColor: '#fff', borderRadius: 6 }}
          >
            {/* Wir editieren in HTML (Quill) */}
            <ReactQuill
             style={{
               minHeight: '180px', /* <- Eingabefeld-Mindesthöhe */
               padding: '12px',
             }}
              theme="snow"
              modules={quillModules}
              formats={quillFormats}
              value={localContent.body}
              onChange={handleContentChange}
            />
          </div>

          {(onSave || onCancel) && (
            <div
              /* .actions */
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '20px',
                marginBottom: '16px',
                paddingRight: '24px',
                paddingBottom: '16px',
              }}
            >
              {onSave && (
                <JoyButton
                  onClick={handleEdit}
                  disabled={!isTitleValid}
                  title={isTitleValid ? 'Speichern' : 'Titel darf nicht leer sein'}
                >
                  Speichern
                </JoyButton>
              )}
              <JoyButton onClick={handleCancel}>Abbrechen</JoyButton>
            </div>
          )}
        </>
      )}
    </article>
    </>
  );
};

export default NewsPostCard;
