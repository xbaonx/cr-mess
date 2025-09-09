import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Crypto WebView</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-md mx-auto p-4">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}
