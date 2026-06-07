'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface SubSystemConfig {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  backHref?: string;
  backLabel?: string;
}

interface UserInfo {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  displayName: string;
}

export default function NavSidebar({ config }: { config?: SubSystemConfig }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) r.json().then(setUser);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItems = config?.navItems || [];

  const userSection = user && (
    <div className="p-3 border-t border-stone-700">
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-stone-200 truncate">{user.displayName}</div>
          <div className="text-xs text-stone-400">{user.role === 'admin' ? '管理员' : '库管员'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-2 py-1 rounded text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
        >
          退出
        </button>
      </div>
    </div>
  );

  const backLink = config?.backHref ? (
    <Link
      href={config.backHref}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-700 hover:text-white transition-colors"
    >
      <span>&larr;</span>
      <span>{config.backLabel || '返回主页'}</span>
    </Link>
  ) : null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-56 bg-stone-800 text-stone-100 z-30">
        <div className="p-4 border-b border-stone-700">
          <h1 className="text-lg font-bold tracking-wide">{config?.title}</h1>
          <p className="text-xs text-stone-400 mt-1">{config?.subtitle}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {backLink}
          {backLink && <div className="border-t border-stone-700 my-1" />}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? 'bg-amber-700 text-white font-medium'
                  : 'text-stone-300 hover:bg-stone-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        {userSection}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-stone-800 text-stone-100 z-30 safe-bottom border-t border-stone-700">
        <div className="flex items-center justify-between px-3 h-16">
          <div className="flex-1 flex justify-around">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg min-w-0 text-xs transition-colors ${
                  isActive(item.href)
                    ? 'text-amber-400 font-medium'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate max-w-[48px]">{item.label}</span>
              </Link>
            ))}
          </div>
          {user && (
            <button
              onClick={handleLogout}
              className="text-xs px-2 py-1 rounded text-stone-400 hover:text-white shrink-0"
            >
              退出
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
