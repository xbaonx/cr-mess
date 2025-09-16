import React from 'react';
import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/referral" className="p-4 border rounded-md hover:bg-gray-50">
          <div className="font-semibold">Referral & Payout</div>
          <div className="text-sm text-gray-500">View ledger, dry-run and execute payouts</div>
        </Link>
        <Link href="/admin/tokens" className="p-4 border rounded-md hover:bg-gray-50">
          <div className="font-semibold">Tokens</div>
          <div className="text-sm text-gray-500">View cached token catalog and refresh</div>
        </Link>
      </div>
    </div>
  );
}
