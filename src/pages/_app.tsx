import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import 'reflect-metadata';

import ReduxProvider from '@/store/layout/ReduxProvider';

import Layout from '@/components/layout/Layout';
import SnackbarAlert from '@/components/Utility/SnackbarAlert';

import theme from '@/theme';

import '@/styles/sass/main.scss';
import '@/styles/sass/global.scss';

declare global {
  interface Window {
    google: any;
  }
}

/**
 *
 * @param root0
 * @param root0.Component
 * @param root0.pageProps
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <ReduxProvider>
        <Layout>
          <Component {...pageProps} />
          <SnackbarAlert />
        </Layout>
      </ReduxProvider>
    </ThemeProvider>
  );
}
