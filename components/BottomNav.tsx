import Link from 'next/link';
import { useRouter } from 'next/router';
import { withUidPath, useUserId } from '@utils/useUserId';
import useSWR from 'swr';
import { getFeatures } from '@utils/api';

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md ${
        active ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <span className="h-6 w-6" aria-hidden>
        {icon}
      </span>
      <span className="text-xs">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const router = useRouter();
  const uid = useUserId();
  const path = router.pathname;
  const { data: features } = useSWR('features', getFeatures, { revalidateOnFocus: false, refreshInterval: 60000 });

  const marketsHref = withUidPath('/markets', uid);
  const dashboardHref = withUidPath('/dashboard', uid);
  const buyHref = withUidPath('/buy-usdt', uid);
  const showBuy = features?.enableBuy !== false;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/70">
      <div className="mx-auto max-w-md px-4 py-2 grid grid-cols-3">
        <NavItem
          href={marketsHref}
          label="Markets"
          active={path.startsWith('/markets') || path.startsWith('/token')}
          icon={(
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path d="M4 17V7m8 10V3m8 14V10" />
            </svg>
          )}
        />
        <NavItem
          href={dashboardHref}
          label="Dashboard"
          active={path.startsWith('/dashboard')}
          icon={(
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path d="M3 10l9-7 9 7v9a2 2 0 01-2 2h-3a2 2 0 01-2-2v-5H8v5a2 2 0 01-2 2H3z" />
            </svg>
          )}
        />
        {showBuy && (
          <NavItem
            href={buyHref}
            label="Buy USDT"
            active={path.startsWith('/buy-usdt')}
            icon={(
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                <path d="M12 3v18m-6-6h12" />
              </svg>
            )}
          />
        )}
      </div>
    </nav>
  );
}
