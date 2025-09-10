import React from 'react';
import { TokenInfo } from '@utils/api';

type Props = {
  tokens: TokenInfo[];
  showTotal?: boolean;
};

function formatNumber(num: number) {
  if (!isFinite(num)) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(num);
}

export default function TokenList({ tokens, showTotal = false }: Props) {
  const totalUsd = tokens.reduce((acc, t) => acc + (parseFloat(t.balance || '0') * (t.priceUsd || 0)), 0);

  return (
    <div className="space-y-2">
      {showTotal && (
        <div className="flex justify-between items-center card">
          <div className="text-sm text-gray-400">Total value</div>
          <div className="text-lg font-semibold">${formatNumber(totalUsd)}</div>
        </div>
      )}
      <div className="space-y-2">
        {tokens.map((t) => {
          const usd = parseFloat(t.balance || '0') * (t.priceUsd || 0);
          return (
            <div key={t.symbol} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold">
                  {t.symbol.slice(0, 4).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{t.symbol.toUpperCase()}</div>
                  <div className="text-sm text-gray-400">{t.name || ''}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatNumber(parseFloat(t.balance || '0'))}</div>
                <div className="text-sm text-gray-400">${formatNumber(usd)}</div>
              </div>
            </div>
          );
        })}
        {tokens.length === 0 && (
          <div className="text-center text-gray-400 text-sm">No tokens</div>
        )}
      </div>
    </div>
  );
}
