'use client';

import { usePathname } from 'next/navigation';
import NavSidebar, { SubSystemConfig } from './NavSidebar';

const relicConfig: SubSystemConfig = {
  title: '文物库房台账',
  subtitle: '中国社会科学院考古研究所东南工作队',
  navItems: [
    { href: '/relics', label: '文物列表', icon: '📦' },
    { href: '/relics/new', label: '新建文物', icon: '➕' },
    { href: '/checkout', label: '出库登记', icon: '📤' },
    { href: '/checkin', label: '入库登记', icon: '📥' },
    { href: '/history', label: '出入库记录', icon: '📋' },
  ],
  backHref: '/',
  backLabel: '返回主页',
};

const toolConfig: SubSystemConfig = {
  title: '工具管理系统',
  subtitle: '中国社会科学院考古研究所东南工作队',
  navItems: [
    { href: '/tools', label: '工具列表', icon: '🔧' },
    { href: '/tools/new', label: '新建工具', icon: '➕' },
    { href: '/tools/checkout', label: '工具出库', icon: '📤' },
    { href: '/tools/checkin', label: '工具入库', icon: '📥' },
    { href: '/tools/history', label: '工具记录', icon: '📝' },
  ],
  backHref: '/',
  backLabel: '返回主页',
};

const accountingConfig: SubSystemConfig = {
  title: '记账系统',
  subtitle: '中国社会科学院考古研究所东南工作队',
  navItems: [
    { href: '/accounting', label: '账本选择', icon: '📊' },
    { href: '/accounting/living', label: '生活账本', icon: '🍚' },
    { href: '/accounting/work', label: '工作账本', icon: '💼' },
  ],
  backHref: '/',
  backLabel: '返回主页',
};

const vehicleConfig: SubSystemConfig = {
  title: '田野用车使用登记',
  subtitle: '中国社会科学院考古研究所东南工作队',
  navItems: [
    { href: '/vehicles', label: '用车记录', icon: '🚗' },
  ],
  backHref: '/',
  backLabel: '返回主页',
};

const assetsConfig: SubSystemConfig = {
  title: '固定资产登记',
  subtitle: '中国社会科学院考古研究所东南工作队',
  navItems: [
    { href: '/assets', label: '资产列表', icon: '🏢' },
  ],
  backHref: '/',
  backLabel: '返回主页',
};

const sealConfig: SubSystemConfig = {
  title: '公章使用登记',
  subtitle: '中国社会科学院考古研究所东南工作队',
  navItems: [
    { href: '/seals', label: '用章记录', icon: '🪪' },
  ],
  backHref: '/',
  backLabel: '返回主页',
};

function getConfig(pathname: string): SubSystemConfig | undefined {
  if (pathname === '/login' || pathname === '/') return undefined;

  if (
    pathname.startsWith('/relics') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/checkin') ||
    pathname.startsWith('/history')
  ) {
    return relicConfig;
  }

  if (pathname.startsWith('/tools')) {
    return toolConfig;
  }

  if (pathname.startsWith('/accounting')) {
    return accountingConfig;
  }

  if (pathname.startsWith('/vehicles')) {
    return vehicleConfig;
  }

  if (pathname.startsWith('/assets')) {
    return assetsConfig;
  }

  if (pathname.startsWith('/seals')) {
    return sealConfig;
  }

  return undefined;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const config = getConfig(pathname);

  if (!config) {
    return <>{children}</>;
  }

  return (
    <>
      <NavSidebar config={config} />
      <main className="flex-1 p-4 pb-20 lg:pb-4 lg:ml-56 overflow-auto">
        {children}
      </main>
    </>
  );
}
