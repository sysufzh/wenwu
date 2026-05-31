'use client';

import { usePathname } from 'next/navigation';
import NavSidebar from './NavSidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <NavSidebar />
      <main className="flex-1 p-4 pb-20 lg:pb-4 lg:ml-56 overflow-auto">
        {children}
      </main>
    </>
  );
}
