import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Button as JoyButton, Checkbox as JoyCheckbox } from '@mui/joy';

// Falls ihr Next.js nutzt, ReactQuill dynamisch importieren.
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import 'react-quill/dist/quill.snow.css';

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

const departmentOptions = ['Alle', 'F1', 'F2', 'F3', 'F4'];

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
  const [localDepartment, setLocalDepartment] = useState<string[]>(
    department ? department.split(',') : ['Alle']
  );

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

  const handleCheckboxChange = (option: string) => {
    const fachbereiche = ['F1', 'F2', 'F3', 'F4'];
    if (option === 'Alle') {
      setLocalDepartment(['Alle']);
    } else {
      let next = localDepartment.includes(option)
        ? localDepartment.filter((d) => d !== option)
        : [...localDepartment.filter((d) => d !== 'Alle'), option];
      if (fachbereiche.every((fb) => next.includes(fb))) next = ['Alle'];
      if (next.length === 0) next = ['Alle'];
      next =
        next[0] === 'Alle'
          ? ['Alle']
          : fachbereiche.filter((fb) => next.includes(fb));
      setLocalDepartment(next);
    }
  };

  const buildPayload = useCallback((): NewsPostCreate | NewsPostUpdate => {
    return {
      // Pflichtfelder laut Schema
      id: post.id,
      title: localTitle.trim(),
      content: { format: 'html', body: localContent.body },
      author: post.author ?? { user_id: 'unknown', name: authorName },
      creation_date: post.creation_date ?? new Date().toISOString(),
      permissions: (post as NewsPostCreate).permissions,
    };
  }, [post, localTitle, localContent.body, authorName]);

  const handleSave = useCallback(() => {
    const payload = buildPayload();
    onSave?.({ post: payload });

    // Nach Speichern zurücksetzen für neuen Post (nur im add-Modus sinnvoll)
    if (postView === 'add') {
      setLocalTitle('');
      setLocalContent({ format: 'html', body: '' });
    }
  }, [buildPayload, onSave, postView]);

  const handleEdit = useCallback(() => {
    const payload = buildPayload();
    onSave?.({ post: payload });
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


    <article
      style={{
        width: '100%',
        maxWidth: '1000px',
        minHeight: '340px',
        margin: '35px auto',
        padding: '30px',
        background: '#e3edf9',
        borderRadius: '12px',
        overflow: 'hidden',
        color: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          padding: '16px 16px 24px 24px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {postView === 'edit' || postView === 'add' ? (
          <>
            <input
              /* .titleInput */
              style={{
                width: 'calc(100% - 8px)',
                boxSizing: 'border-box',
                fontSize: '24px',
                fontWeight: 700,
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '6px 13px',
                outline: 'none',
                marginLeft: '4px',
                marginRight: '4px',
              }}
              type="text"
              placeholder="Titel eingeben…"
              value={localTitle}
              onChange={handleTitleChange}
            />
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
                      ? localDepartment.join(', ')
                      : 'Alle auswählen'}
                  </JoyButton>
                  {dropdownOpen && (
                    <div
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
                          key={option}
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
                            checked={localDepartment.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                          />
                          <span>{option}</span>
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
                Fachbereich: {localDepartment.join(', ')}
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
