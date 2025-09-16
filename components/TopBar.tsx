import Link from 'next/link';

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60 border-b border-gray-800/50">
      <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
        <img
          src="/logo.png"
          alt="App Logo"
          width={28}
          height={28}
          className="h-7 w-7 rounded-md object-contain ring-1 ring-amber-500/30 bg-gray-900"
        />
        <Link href="/" className="text-lg font-bold text-gray-100 hover:text-white">
          Crypto WebView
        </Link>
        <div className="ml-auto text-xs text-gray-500">beta</div>
      </div>
    </header>
  );
}
