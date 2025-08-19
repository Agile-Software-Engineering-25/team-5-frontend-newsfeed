import { Box, Typography } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@mui/material';
import BasicPostComponent from '../../components/BasicPostComponent/BasicPostComponent';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <BasicPostComponent
        title="Breaking News: Alle bekommen eine 1,0 für SAU?!?!"
        author="Sekretariat"
        date="13.08.2025"
        content={`Liebe Studierende,

wir haben großartige Neuigkeiten für Sie: Alle Teilnehmerinnen und Teilnehmer des ASE-Programmierprojekts erhalten die Bestnote 1,0! 🎉
Während des gesamten Projekts haben Sie gezeigt, dass Sie nicht nur programmieren können, sondern auch im Team zusammenarbeitet, Probleme kreativ lösen und sich gegenseitig unterstützen können. Viele von Ihnen sind weit über die eigentlichen Anforderungen hinausgegangen, um innovative Ideen umzusetzen und qualitativ hochwertige Ergebnisse zu liefern.

Wir möchten Ihnen herzlich für den Einsatz danken. Diese Bestnote haben Sie sich redlich verdient – jede einzelne Zeile Code, jede Diskussion im Team und jeder Lösungsansatz haben dazu beigetragen, dass dieses Projekt zu einem vollen Erfolg wurde.

Beste Grüße
Ihr Sekretariat`}
      />
      <BasicPostComponent
        title="Khalid gönnt ne Runde Eis nach seinem Urlaub?!"
        author="Khalid Lakniti"
        date="08.08.2025"
        content={`Liebe Kolleg*innen,
          
          ja es ist wahr. Wie versprochen gibts am ersten Tag nach meinem Urlaub direkt für jede*n von euch vier Kugeln auf meinen Nacken. 
          
          Viele Grüße
          Khalid`}
      />
      <BasicPostComponent
        title="Die Mensa bekommt einen McDonalds!"
        author="Sekretariat"
        date="01.08.2025"
        content={`Liebe Studierende,

ab dem kommenden Semester erwartet Sie in der Mensa eine ganz besondere Neuerung: Ein McDonald’s zieht ein! 🍔🍟
Damit haben Sie künftig nicht nur die gewohnte Mensa-Auswahl, sondern auch Burger, Pommes und Co. direkt auf dem Campus.

Wir sind gespannt, wie Ihnen das neue Angebot gefällt – guten Appetit schon mal vorab! 😄

Beste Grüße
Euer Sekretariat`}
      />
    </div>
  );
};

export default Home;
