import Link from 'next/link';
import React from 'react';

export default function AdminLayout({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-20 border-b border-gray-900 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link className="hover:text-amber-400" href="/admin">Overview</Link>
            <Link className="hover:text-amber-400" href="/admin/features">Features</Link>
            <Link className="hover:text-amber-400" href="/admin/users">Users</Link>
            <Link className="hover:text-amber-400" href="/admin/tokens">Tokens</Link>
            <Link className="hover:text-amber-400" href="/admin/referral">Referral</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
