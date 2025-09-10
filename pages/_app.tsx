import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import BottomNav from '@components/BottomNav';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Crypto WebView</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='140' fill='black'%3E%C2%A5%3C/text%3E%3C/svg%3E"
        />
      </Head>
      <div className="min-h-screen bg-gray-950">
        <main className="max-w-md mx-auto p-4 pb-20">
          <Component {...pageProps} />
        </main>
        <BottomNav />
      </div>
    </>
  );
}
