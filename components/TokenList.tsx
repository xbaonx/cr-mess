import React from 'react';
import { TokenInfo } from '@utils/api';

type Props = {
  tokens: TokenInfo[];
  linkBuilder?: (t: TokenInfo) => string | undefined;
};

function formatNumber(num: number) {
  if (!isFinite(num)) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(num);
}

export default function TokenList({ tokens, linkBuilder }: Props) {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {tokens.map((t) => {
          const href = linkBuilder ? linkBuilder(t) : undefined;
          const content = (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {t.logoUrl ? (
                  <img
                    src={t.logoUrl}
                    alt={t.symbol}
                    className="h-10 w-10 rounded-full object-cover bg-gray-800 ring-2 ring-gray-700/50"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold ring-2 ring-gray-700/50">
                    {t.symbol.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium">{t.symbol.toUpperCase()}</div>
                  <div className="text-sm text-gray-400">{t.name || ''}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatNumber(parseFloat(t.balance || '0'))}</div>
              </div>
            </div>
          );
          return href ? (
            <a key={t.symbol} href={href} className="card list-item group">
              {content}
            </a>
          ) : (
            <div key={t.symbol} className="card">
              {content}
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
