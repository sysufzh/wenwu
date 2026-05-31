'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: '总览', icon: '📊' },
  { href: '/relics', label: '文物列表', icon: '📦' },
  { href: '/relics/new', label: '新建文物', icon: '➕' },
  { href: '/checkout', label: '出库登记', icon: '📤' },
  { href: '/checkin', label: '入库登记', icon: '📥' },
  { href: '/history', label: '出入库记录', icon: '📋' },
];

interface UserInfo {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  displayName: string;
}

export default function NavSidebar() {
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-56 bg-stone-800 text-stone-100 z-30">
        <div className="p-4 border-b border-stone-700">
          <h1 className="text-lg font-bold tracking-wide">文物库房台账</h1>
          <p className="text-xs text-stone-400 mt-1">考古研究所东南队</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
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
