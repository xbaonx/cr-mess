import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import BottomNav from '@components/BottomNav';
import TopBar from '@components/TopBar';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Crypto WebView</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/logo.png" />
        <meta property="og:title" content="Crypto WebView" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Crypto WebView" />
      </Head>
      <div className="min-h-screen bg-gray-950">
        <TopBar />
        <main className="max-w-md mx-auto p-4 pb-20">
          <Component {...pageProps} />
        </main>
        <BottomNav />
      </div>
    </>
  );
}
