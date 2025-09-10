import React from 'react';

export function SkeletonLine({ className = "h-4 bg-gray-800 rounded animate-pulse" }: { className?: string }) {
  return <div className={className} />;
}

export function SkeletonCard({ children, className = "card space-y-3" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function TokenListSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonCard>
        <div className="flex justify-between items-center">
          <SkeletonLine className="h-4 bg-gray-800 rounded animate-pulse w-20" />
          <SkeletonLine className="h-6 bg-gray-800 rounded animate-pulse w-24" />
        </div>
      </SkeletonCard>
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-800 animate-pulse" />
              <div className="space-y-2">
                <SkeletonLine className="h-4 bg-gray-800 rounded animate-pulse w-16" />
                <SkeletonLine className="h-3 bg-gray-800 rounded animate-pulse w-24" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <SkeletonLine className="h-4 bg-gray-800 rounded animate-pulse w-20" />
              <SkeletonLine className="h-3 bg-gray-800 rounded animate-pulse w-16" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function MarketListSkeleton() {
  return (
    <div className="card p-0">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-800 last:border-b-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-800 animate-pulse" />
            <div className="space-y-2">
              <SkeletonLine className="h-4 bg-gray-800 rounded animate-pulse w-16" />
              <SkeletonLine className="h-3 bg-gray-800 rounded animate-pulse w-24" />
            </div>
          </div>
          <SkeletonLine className="h-4 bg-gray-800 rounded animate-pulse w-6" />
        </div>
      ))}
    </div>
  );
}

export function TokenDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonLine className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
        <SkeletonLine className="h-8 bg-gray-800 rounded animate-pulse w-24" />
      </div>
      
      <SkeletonCard>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-800 animate-pulse" />
          <div className="space-y-2">
            <SkeletonLine className="h-6 bg-gray-800 rounded animate-pulse w-20" />
            <SkeletonLine className="h-4 bg-gray-800 rounded animate-pulse w-32" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <div className="h-40 w-full rounded-md bg-gray-800 animate-pulse" />
      </SkeletonCard>
    </div>
  );
}
