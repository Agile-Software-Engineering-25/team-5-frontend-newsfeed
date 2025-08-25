import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import EditableBasicPostComponent from '../../components/BasicEditComponent/BasicEditComponent.tsx';

/** ====== Typen ====== */
interface NewsPost {
  post_id: number; // eindeutige ID
  title: string;
  author: string;
  date: string; // intern: ISO (YYYY-MM-DD) empfohlen
  content: string; // HTML-String
  maintain?: boolean; // steuert Edit-/Remove-Buttons
}

/** ====== Rollen-Konstante ====== */
let role: 'admin' | 'user' | 'prof' = 'admin';

/** ====== Vorlage für „neuen Post“ (Editor oben) ====== */
const emptyPost: NewsPost = {
  post_id: 0,
  title: '',
  author: '',
  date: '',
  content: '',
  maintain: false,
};

/** ====== Mock-Daten (außerhalb der Komponente halten) ======
 * Hinweis: Für zuverlässige Sortierung am besten ISO-Daten verwenden.
 * Hier konvertiert aus DD.MM.YYYY → YYYY-MM-DD
 */
const mock_news_posts: NewsPost[] = [
  {
    post_id: 5,
    title: 'Breaking News: Alle bekommen eine 1,0 für SAU?!?!',
    author: 'Sekretariat',
    date: '2025-08-13',
    content: `<p>Liebe Studierende,</p>
              <p>wir haben großartige Neuigkeiten für Sie: Alle Teilnehmerinnen und Teilnehmer des ASE-Programmierprojekts erhalten die Bestnote 1,0! 🎉</p>
              <p>Während des gesamten Projekts haben Sie gezeigt, dass Sie nicht nur programmieren können, sondern auch im Team zusammenarbeiten, Probleme kreativ lösen und sich gegenseitig unterstützen können.</p>
              <p>Beste Grüße</p>
              <p>Ihr Sekretariat</p>`,
  },
  {
    post_id: 4,
    title: 'Serverwartung am Wochenende',
    author: 'IT-Support',
    date: '2025-08-15',
    content: `<p>Liebe Nutzerinnen und Nutzer,</p>
              <p>bitte beachten Sie, dass unsere Server am <strong>Samstag, den 16.08.2025</strong>, 
              von <em>22:00 bis 02:00 Uhr</em> wegen Wartungsarbeiten nicht erreichbar sein werden.</p>
              <p>Wir bitten um Ihr Verständnis.</p>
              <p>Ihr IT-Support</p>`,
  },
  {
    post_id: 3,
    title: 'Neue Mensa-Speisekarte online',
    author: 'Studentenwerk',
    date: '2025-08-12',
    content: `<p>Liebe Studierende,</p>
              <p>ab sofort ist die neue Speisekarte der Mensa für das kommende Semester online verfügbar.</p>
              <ul>
                <li>Mehr vegetarische und vegane Optionen</li>
                <li>Täglich wechselnde Mittagsgerichte</li>
                <li>Neue Desserts 🍰</li>
              </ul>
              <p>Guten Appetit!</p>
              <p>Ihr Studentenwerk</p>`,
  },
  {
    post_id: 2,
    title: 'Gastvortrag: KI in der Medizin',
    author: 'Fakultät Informatik',
    date: '2025-08-11',
    content: `<p>Sehr geehrte Damen und Herren,</p>
              <p>wir laden Sie herzlich zum Gastvortrag von <strong>Prof. Dr. Müller</strong> zum Thema 
              <q>Künstliche Intelligenz in der Medizin</q> ein.</p>
              <p>
                📅 Datum: 20.08.2025<br/>
                ⏰ Uhrzeit: 18:00 Uhr<br/>
                📍 Ort: Hörsaal 3
              </p>
              <p>Wir freuen uns auf Ihr Kommen.</p>
              <p>Ihre Fakultät Informatik</p>`,
  },
  {
    post_id: 1,
    title: 'Sommerfest im Campusgarten',
    author: 'Fachschaft',
    date: '2025-08-10',
    content: `<p>Hallo zusammen,</p>
              <p>wir laden euch herzlich zu unserem <strong>Sommerfest</strong> im Campusgarten ein!</p>
              <p>
                📅 Datum: 22.08.2025<br/>
                ⏰ Uhrzeit: ab 16:00 Uhr<br/>
                🎶 Musik, 🍔 BBQ und 🍹 Cocktails warten auf euch.
              </p>
              <p>Kommt vorbei, bringt gute Laune mit und lasst uns gemeinsam feiern!</p>
              <p>Eure Fachschaft</p>`,
  },
];

/** ====== Helper ====== */
const fmtDE = (isoDate: string) =>
  isoDate ? new Date(isoDate).toLocaleDateString('de-DE') : '';

/** ====== Seite ====== */
const Home = () => {
  const { t } = useTranslation();

  // State mit Mockdaten starten
  const [localPostsList, setLocalPostsList] =
    useState<NewsPost[]>(mock_news_posts);

  // Sortiert (neueste oben) berechnen – bleibt stabil zwischen Renders
  const sortedPosts = useMemo(
    () =>
      [...localPostsList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [localPostsList]
  );

  /** ----- Neuer Post speichern (vom Editor oben) ----- */
  const handleCreate = ({
    title,
    content,
  }: {
    post_id?: number; // ignoriert beim Erstellen
    title: string;
    content: string;
  }) => {
    const newPost: NewsPost = {
      post_id: (localPostsList[0]?.post_id ?? 0) + 1, // simple ID-Logik; ggf. anpassen
      title,
      author: 'Aktuell',
      date: new Date().toISOString().slice(0, 10), // ISO
      content,
      maintain: role === 'admin',
    };

    console.log('Neuer Post:', newPost);

    setLocalPostsList((prev) =>
      [...prev, newPost].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  };

  /** ----- Bestehenden Post aktualisieren ----- */
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

  /** ----- Post entfernen ----- */
  const handleRemove = (post_id: number) => {
    setLocalPostsList((prev) => prev.filter((p) => p.post_id !== post_id));
  };

  return (
    <div>
      {/* Admin-Editor für neuen Post */}
      {role === 'admin' && (
        <EditableBasicPostComponent
          key={emptyPost.post_id}
          title={emptyPost.title}
          author={emptyPost.author}
          date={emptyPost.date}
          content={emptyPost.content}
          addPost={true}
          maintain={true}
          onSave={handleCreate}
        />
      )}

      {/* Liste: neueste oben, Datum für Anzeige formatiert */}
      {sortedPosts.map((post) => (
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
