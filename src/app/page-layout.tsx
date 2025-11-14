'use client';

import { usePathname } from 'next/navigation';

export function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        {children}
      </main>
    );
  }

  return <main className="flex-1">{children}</main>;
}
