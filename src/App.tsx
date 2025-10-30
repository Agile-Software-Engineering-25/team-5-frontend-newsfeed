import { BrowserRouter } from 'react-router';
import { THEME_ID as MATERIAL_THEME_ID } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy';
import './i18n';
import { Provider } from 'react-redux';
import store from '@stores/index.ts';
import Newsfeed from '@pages/Newsfeed/Newsfeed.tsx';
import {
  createCustomJoyTheme,
  createCustomMuiTheme,
} from '@agile-software/shared-components';

import useUser from '@/hooks/useUser';
import { setDynamicHeadersProvider } from '@/services/apiClient';
import { useEffect } from 'react';

const joyTheme = createCustomJoyTheme();
const muiTheme = createCustomMuiTheme();

function App(props: { basename: string }) {
  const { basename } = props;
  const user = useUser();
  const token = user.getAccessToken();

  useEffect(() => {
    setDynamicHeadersProvider(() => {
      const h: Record<string, string> = {};
      if (token) h.Authorization = `Bearer ${token}`;
      console.log("Tokennnnn"+ token)
      return h;
    });
  }, [token]);

  return (
    <Provider store={store}>
      <ThemeProvider theme={{ [MATERIAL_THEME_ID]: muiTheme }}>
        <JoyCssVarsProvider
          theme={joyTheme}
          defaultMode="light"
          modeStorageKey="joy-mode"
          colorSchemeStorageKey="joy-color-scheme"
        >
          <BrowserRouter basename={basename}>
            <Newsfeed />
          </BrowserRouter>
        </JoyCssVarsProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
