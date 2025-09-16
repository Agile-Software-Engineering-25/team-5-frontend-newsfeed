import { useMemo, useState } from 'react';
import EditableBasicPostComponent from '../../components/BasicEditComponent/BasicEditComponent.tsx';

// ⬇️ NEU: FilterBar + Typen/Helper
import FilterBar, {
  type FilterState,
  buildQuery,
} from '../../components/FilterBar/FilterBar.tsx';

/** ====== Typen ====== */
interface NewsPost {
  post_id: number; // eindeutige ID
  title: string;
  author: string;
  date: string; // ISO (YYYY-MM-DD) empfohlen
  content: string; // HTML-String
  maintain?: boolean; // steuert Edit-/Remove-Buttons
}

/** ====== Rollen-Konstante ====== */
const role: 'admin' | 'user' | 'prof' = 'admin';

/** ====== Vorlage für „neuen Post“ (Editor oben) ====== */
const emptyPost: NewsPost = {
  post_id: 0,
  title: '',
  author: '',
  date: '',
  content: '',
  maintain: false,
};

/** ====== Mock-Daten ====== */
const mock_news_posts: NewsPost[] = [
  {
    post_id: 5,
    title: 'Breaking News: Alle bekommen eine 1,0 für SAU?!?!',
    author: 'Sekretariat',
    date: '2025-08-13',
    content: `<p>Liebe Studierende,</p>...`,
  },
  {
    post_id: 4,
    title: 'Serverwartung am Wochenende',
    author: 'IT-Support',
    date: '2025-08-15',
    content: `<p>Liebe Nutzerinnen und Nutzer,</p>...`,
  },
  {
    post_id: 3,
    title: 'Neue Mensa-Speisekarte online',
    author: 'Studentenwerk',
    date: '2025-08-12',
    content: `<p>Liebe Studierende,</p>...`,
  },
  {
    post_id: 2,
    title: 'Gastvortrag: KI in der Medizin',
    author: 'Fakultät Informatik',
    date: '2025-08-11',
    content: `<p>Sehr geehrte Damen und Herren,</p>...`,
  },
  {
    post_id: 1,
    title: 'Sommerfest im Campusgarten',
    author: 'Fachschaft',
    date: '2025-08-10',
    content: `<p>Hallo zusammen,</p>...`,
  },
];

/** ====== Helper ====== */
const fmtDE = (isoDate: string) =>
  isoDate ? new Date(isoDate).toLocaleDateString('de-DE') : '';

/** ====== Seite ====== */
const Home = () => {
  // Posts-State
  const [localPostsList, setLocalPostsList] =
    useState<NewsPost[]>(mock_news_posts);

  // ⬇️ NEU: Filter-State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    datePreset: 'all',
    from: undefined,
    to: undefined,
    page: 1,
    pageSize: 10, // 10 Posts pro Seite
  });

  // ⬇️ NEU: Query-String (nur Anzeige)
  const queryString = useMemo(() => buildQuery(filters), [filters]);

  // Sortierung „neueste oben“
  const sortedPosts = useMemo(
    () =>
      [...localPostsList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [localPostsList]
  );

  // ⬇️ NEU: Filtern + Pagination
  const visiblePosts = useMemo(() => {
    // 1) Textsuche (Titel + Content)
    const s = filters.search.trim().toLowerCase();
    let out = sortedPosts.filter((p) =>
      !s
        ? true
        : p.title.toLowerCase().includes(s) ||
          p.content.toLowerCase().includes(s)
    );

    // 2) Datum (from/to optional)
    const fromTs = filters.from ? new Date(filters.from).getTime() : null;
    const toTs = filters.to ? new Date(filters.to).getTime() : null;

    if (fromTs || toTs) {
      out = out.filter((p) => {
        const ts = new Date(p.date).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
        return true;
      });
    }

    // 3) Pagination
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    return out.slice(start, end);
  }, [sortedPosts, filters]);

  /** ----- Create / Update / Remove ----- */
  const handleCreate = ({
    title,
    content,
  }: {
    post_id?: number;
    title: string;
    content: string;
  }) => {
    const newPost: NewsPost = {
      post_id: (localPostsList[0]?.post_id ?? 0) + 1,
      title,
      author: 'Aktuell',
      date: new Date().toISOString().slice(0, 10),
      content,
      maintain: role === 'admin',
    };
    setLocalPostsList((prev) => [...prev, newPost]);
    // optional: gleich auf Seite 1 springen, damit neuer Post sichtbar ist
    setFilters((f) => ({ ...f, page: 1 }));
  };

  const handleUpdate = ({
    post_id,
    title,
    content,
  }: {
    post_id: number;
    title: string;
    content: string;
  }) => {
    setLocalPostsList((prev) =>
      prev.map((p) => (p.post_id === post_id ? { ...p, title, content } : p))
    );
  };

  const handleRemove = (post_id: number) => {
    setLocalPostsList((prev) => prev.filter((p) => p.post_id !== post_id));
  };

  return (
    <div>
      {/* ⬇️ NEU: Filter-Komponente + Query-String-Anzeige */}
      <FilterBar
        initial={filters}
        onChange={setFilters}
        pageSizeOptions={[10, 20, 50]}
      />
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#555',
          margin: '8px 0 16px',
        }}
      >
        ?{queryString}
      </div>

      {/* Admin-Editor für neuen Post */}
      {role === 'admin' && (
        <EditableBasicPostComponent
          title={emptyPost.title}
          author={emptyPost.author}
          date={emptyPost.date}
          content={emptyPost.content}
          addPost={true}
          maintain={true}
          onSave={handleCreate}
          key={0}
        />
      )}

      {/* Gefilterte & paginierte Liste (bereits nach Datum sortiert) */}
      {visiblePosts.map((post) => (
        <EditableBasicPostComponent
          key={post.post_id}
          title={post.title}
          author={post.author}
          date={fmtDE(post.date)}
          content={post.content}
          maintain={role === 'admin'}
          onSave={handleUpdate}
          onRemove={() => handleRemove(post.post_id)}
        />
      ))}
    </div>
  );
};

export default Home;
