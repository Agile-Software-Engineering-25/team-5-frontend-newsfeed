import { Box, Typography } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import {data, useNavigate} from 'react-router';
import { Button } from '@mui/material';
import BasicPostComponent from '../../components/BasicPostComponent/BasicPostComponent';
import EditableBasicPostComponent from "../../components/BasicEditComponent/BasicEditComponent.tsx";


interface news_post_object {
    post_id : number | null; // Post ID, kann null sein, wenn neu
    title: string;
    author: string;
    date: string;
    content: string;
    editable: boolean;
}

// Das NewsPost js Objekt:

let news_post: news_post_object = {
    post_id: null,
    title: "",
    author: "",
    date: "",
    content: "",
    editable: false,

}


const mock_news_posts: news_post_object[] = [
    {
        post_id: 1,
        title: "Breaking News: Alle bekommen eine 1,0 für SAU?!?!",
        author: "Sekretariat",
        date: "13.08.2025",
        content: `<div><pre>
Liebe Studierende,<br /><br />
wir haben großartige <b>Neuigkeiten</b> für Sie: Alle Teilnehmerinnen und Teilnehmer des ASE-Programmierprojekts erhalten die Bestnote 1,0! 🎉<br />
Während des gesamten Projekts haben Sie gezeigt, dass Sie nicht nur programmieren können, sondern auch im Team zusammenarbeiten, Probleme kreativ lösen und sich gegenseitig unterstützen können.<br /><br />
Beste Grüße<br />
Ihr Sekretariat
</pre></div>`,
        editable: false,
    },
    {
        post_id: 2,
        title: "Serverwartung am Wochenende",
        author: "IT-Support",
        date: "15.08.2025",
        content: `<div><pre>
Liebe Nutzerinnen und Nutzer,<br /><br />
bitte beachten Sie, dass unsere Server am Samstag, den 16.08.2025, von 22:00 bis 02:00 Uhr wegen Wartungsarbeiten nicht erreichbar sein werden.<br />
Wir bitten um Ihr Verständnis.<br /><br />
Mit freundlichen Grüßen<br />
Ihr IT-Support
</pre></div>`,
        editable: false,
    },
    {
        post_id: 3,
        title: "Neue Mensa-Speisekarte online",
        author: "Studentenwerk",
        date: "12.08.2025",
        content: `<div><pre>
Liebe Studierende,<br /><br />
ab sofort ist die neue Speisekarte der Mensa für das kommende Semester online verfügbar.<br />
Es erwarten Sie viele neue Gerichte, darunter auch mehr vegetarische und vegane Optionen.<br /><br />
Guten Appetit! 🍽️<br /><br />
Ihr Studentenwerk
</pre></div>`,
        editable: false,
    },
    {
        post_id: 4,
        title: "Gastvortrag: KI in der Medizin",
        author: "Fakultät Informatik",
        date: "11.08.2025",
        content: `<div><pre>
Sehr geehrte Damen und Herren,<br /><br />
wir laden Sie herzlich zum Gastvortrag von Prof. Dr. Müller zum Thema 
"Künstliche Intelligenz in der Medizin" ein.<br />
📅 Datum: 20.08.2025<br />
⏰ Uhrzeit: 18:00 Uhr<br />
📍 Ort: Hörsaal 3<br /><br />
Wir freuen uns auf Ihr Kommen.<br /><br />
Ihre Fakultät Informatik
</pre></div>`,
        editable: false,
    }
];



const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>


        {mock_news_posts.map((post) => (
            <EditableBasicPostComponent
                title={post.title}
                author={post.author}
                date={post.date}
                content={post.content}
                editable={post.editable}
                onChange={({ title, content }) => {
                    // z.B. lokales State-Lifting, Auto-Save etc.
                    // console.log("CHANGE", title, content);
                }}
                onSave={({ title, content }) => {
                    //Änderungen direkt einfügen

                }}
                onCancel={() => {
                    // ggf. Edit-Mode verlassen oder Werte zurücksetzen
                }}
            />
        ))}






    </div>
  );
};

export default Home;
