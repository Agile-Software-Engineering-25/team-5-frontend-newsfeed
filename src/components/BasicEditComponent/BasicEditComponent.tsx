import React, { useMemo, useState, useCallback } from "react";
import styles from "./BasicEditComponent.module.css";

// Falls ihr Next.js nutzt, bitte dynamisch importieren (siehe Hinweis unten).
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Optional, aber sehr empfohlen für sicheres HTML-Rendering:
import DOMPurify from "dompurify";

interface BasicPostComponentProps {
    title: string;
    author: string;
    date: string;
    content: string; // Quill-HTML wenn aus dem Editor
    editable?: boolean; // <— NEU: Schaltet Edit-Modus
    maintain?: boolean; // optional, falls Remove und Edit Buttons angezeigt werden sollen
    onSave?: (data: { title: string; content: string }) => void;   // optional
    onCancel?: () => void;                                         // optional
}

const EditableBasicPostComponent: React.FC<BasicPostComponentProps> = ({
                                                                   title,
                                                                   author,
                                                                   date,
                                                                   content,
                                                                   editable = true,
                                                                   onChange,
                                                                   onSave,
                                                                   onCancel,
                                                               }) => {
    // Lokaler Edit-Status (enthaelt immer die aktuell sichtbaren Werte)
    const [localTitle, setLocalTitle] = useState(title);
    const [localContent, setLocalContent] = useState(content);

    // Quill-Toolbar über dem Content wie bei einer E-Mail
    const quillModules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ["bold", "italic", "underline", "strike", "blockquote"],
                [{ size: [] }, { font: [] }],
                [{ align: ["", "center", "right", "justify"] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                [{ color: [] }, { background: [] }],
                ["clean"],
            ],
        }),
        []
    );

    const quillFormats = useMemo(
        () => [
            "header",
            "bold",
            "italic",
            "underline",
            "strike",
            "blockquote",
            "list",
            "bullet",
            "link",
            "image",
            "color",
            "background",
            "align",
            "size",
            "font",
        ],
        []
    );

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const next = e.target.value;
            setLocalTitle(next);
            onChange?.({ title: next, content: localContent });
        },
        [localContent, onChange]
    );

    const handleContentChange = useCallback(
        (html: string) => {
            setLocalContent(html);
            onChange?.({ title: localTitle, content: html });
        },
        [localTitle, onChange]
    );

    const handleSave = useCallback(() => {
        onSave?.({ title: localTitle.trim(), content: localContent });
    }, [localTitle, localContent, onSave]);

    const safeHtml = useMemo(() => {
        // nur im View-Modus relevant
        return DOMPurify.sanitize(content || "");
    }, [content]);

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                {editable ? (
                    <input
                        className={styles.titleInput}
                        type="text"
                        placeholder="Titel eingeben…"
                        value={localTitle}
                        onChange={handleTitleChange}
                    />
                ) : (
                    <h2 className={styles.title}>{title}</h2>
                )}

                <div className={styles.meta}>
                    <span className={styles.author}>Von {author}</span>
                    <span className={styles.date}>{date}</span>
                </div>
            </header>

            {editable ? (
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
                                    title={localTitle.trim() ? "Speichern" : "Titel darf nicht leer sein"}
                                >
                                    Speichern
                                </button>
                            )}
                            {onCancel && (
                                <button className={styles.cancelBtn} onClick={onCancel}>
                                    Abbrechen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                // Anzeige: Quill-HTML sicher rendern
                <div
                    className={styles.body}
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                />


            )}
        </article>
    );
};

export default EditableBasicPostComponent;
