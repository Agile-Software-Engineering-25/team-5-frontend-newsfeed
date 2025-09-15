import React, { useMemo, useState, useCallback } from 'react';
import styles from './BasicEditComponent.module.css';

// Falls ihr Next.js nutzt, bitte dynamisch importieren (siehe Hinweis unten).
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Optional, aber sehr empfohlen für sicheres HTML-Rendering:
import DOMPurify from 'dompurify';

interface BasicPostComponentProps {
  key: number;
  title: string;
  author: string;
  date: string;
  content: string;
  department?: string;
  addPost?: boolean;
  maintain?: boolean | undefined;
  onChange?: (data: {
    post_id: number;
    title: string;
    content: string;
    department?: string;
  }) => void;
  onSave?: (data: { post_id: number; title: string; content: string; department?: string }) => void;
  onCancel?: () => void;
  onRemove?: (data: { post_id: number }) => void;
}

const EditableBasicPostComponent: React.FC<BasicPostComponentProps> = ({
  key,
  title,
  author,
  date,
  content,
  department = 'Alle',
  addPost = false,
  maintain,
  onChange,
  onSave,
  onCancel,
  onRemove,
}) => {
  // Lokaler Status der Edits
  const [localTitle, setLocalTitle] = useState(title);
  const [localContent, setLocalContent] = useState(content);
  const [localEdit, setLocalEdit] = useState<boolean>(addPost);
  const [localDepartment, setLocalDepartment] = useState<string[]>(department ? department.split(',') : ['Alle']);
  const departmentOptions = ['Alle', 'F1', 'F2', 'F3', 'F4'];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Quill-Toolbar über dem Content 
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ align: ['', 'center', 'right', 'justify'] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        [{ color: [] }, { background: [] }],
,
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

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setLocalTitle(next);
      onChange?.({ post_id: key, title: next, content: localContent });
    },
    [localContent, onChange, key]
  );

  const handleContentChange = useCallback(
    (html: string) => {
      setLocalContent(html);
      onChange?.({ post_id: key, title: localTitle, content: html });
    },
    [localTitle, onChange, key]
  );

  const handleCheckboxChange = (option: string) => {
    if (option === 'Alle') {
      setLocalDepartment(['Alle']);
    } else {
      let next = localDepartment.includes(option)
        ? localDepartment.filter((d) => d !== option)
        : [...localDepartment.filter((d) => d !== 'Alle'), option];
      // Wenn alle Fachbereiche ausgewählt sind, setze auf 'Alle'
      const fachbereiche = ['F1', 'F2', 'F3', 'F4'];
      if (fachbereiche.every(fb => next.includes(fb))) {
        next = ['Alle'];
      }
      if (next.length === 0) next = ['Alle'];
      setLocalDepartment(next);
    }
  };

  const handleSave = useCallback(() => {
    const departmentString = localDepartment.join(',');
    onSave?.({ post_id: key, title: localTitle.trim(), content: localContent, department: departmentString });
    if (addPost) {
      setLocalTitle('');
      setLocalContent('');
      setLocalDepartment(['Alle']);
    } else {
      setLocalEdit(false);
    }
  }, [localTitle, localContent, localDepartment, onSave, key, addPost]);

  const handleCancel = () => {
    setLocalEdit(false);
    setLocalTitle(title); // Ursprünglichen Titel wiederherstellen
    setLocalContent(content); // Ursprünglichen Inhalt wiederherstellen
  };

  const handleRemove = useCallback(() => {
    onRemove?.({ post_id: key });
  }, [onRemove, key]);

  const safeHtml = useMemo(() => {
    // nur im View-Modus relevant
    return DOMPurify.sanitize(localContent || '');
  }, [localContent]);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        {localEdit ? (
          <>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="Titel eingeben…"
              value={localTitle}
              onChange={handleTitleChange}
            />
            <div className={styles.meta}>
              <span className={styles.author}>Von {author}</span>
              <div className={styles.dropdownWrap}>
                <label>Fachbereich:&nbsp;</label>
                <div className={styles.customDropdown}>
                  <button
                    type="button"
                    className={styles.dropdownBtn}
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    {localDepartment.length > 0 ? localDepartment.join(', ') : 'Alle auswählen'}
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdownList}>
                      {departmentOptions.map((option) => (
                        <label key={option} className={styles.dropdownItem}>
                          <input
                            type="checkbox"
                            checked={localDepartment.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className={styles.date}>{date}</span>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.meta}>
              <span className={styles.author}>Von {author}</span>
              <span className={styles.date}>{date}</span>
              <span className={styles.department}>Fachbereich: {localDepartment.join(', ')}</span>
            </div>
          </>
        )}
      </header>

      {localEdit ? (
        <div className={styles.editorWrap}>
          {/* Toolbar sitzt automatisch über dem Editor; zusätzlicher Container für Styling */}
          <ReactQuill
            className={styles.quill}
            theme="snow"
            modules={quillModules}
            formats={quillFormats}
            value={localContent}
            onChange={handleContentChange}
          />
          {(onSave || onCancel) && (
            <div className={styles.actions}>
              {onSave && (
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!localTitle.trim()}
                  title={
                    localTitle.trim()
                      ? 'Speichern'
                      : 'Titel darf nicht leer sein'
                  }
                >
                  Speichern
                </button>
              )}
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Abbrechen
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Anzeige: Quill-HTML sicher rendern */}
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
          <div>
            {maintain}
            {maintain && (
              <button
                className={styles.editBtn}
                onClick={() => {
                  setLocalEdit(true);
                }}
              >
                Bearbeiten
              </button>
            )}
            {/* Optional: Remove-Button, wenn nicht im Edit-Modus */}
            {maintain && (
              <button className={styles.removeBtn} onClick={handleRemove}>
                Entfernen
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
};

export default EditableBasicPostComponent;
