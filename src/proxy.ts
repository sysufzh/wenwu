import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

// 普通用户（user2-user11）不可访问的子系统页面
const RESTRICTED_PREFIXES = [
  '/relics',
  '/checkout',
  '/checkin',
  '/history',
  '/tools',
  '/accounting',
  '/vehicles',
  '/assets',
  '/seals',
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 非管理员仅能访问考古日记与田野考古发掘系统
  if (session.role !== 'admin' && RESTRICTED_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
