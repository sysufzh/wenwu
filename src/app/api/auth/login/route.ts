import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword, toSafeUser } from '@/db/users';
import { createToken, createSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user || !verifyPassword(user, password)) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
    });

    const response = NextResponse.json(toSafeUser(user));
    response.headers.set('Set-Cookie', createSessionCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
