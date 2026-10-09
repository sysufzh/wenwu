import { NextRequest, NextResponse } from 'next/server';
import { getNumberingRequests, createNumberingRequest, NUMBERING_CATEGORIES } from '@/db/numbering';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const result = getNumberingRequests({
      search: sp.get('search') || '',
      status: sp.get('status') || '',
      page: parseInt(sp.get('page') || '1'),
      limit: parseInt(sp.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: '获取记录失败' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const body = await request.json();
    if (!body.category || !NUMBERING_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: '请选择有效的类别' }, { status: 400 });
    }

    const record = createNumberingRequest({
      ...body,
      applicant: session.displayName || session.username,
    });
    return NextResponse.json(record, { status: 201 });
  } catch { return NextResponse.json({ error: '创建失败' }, { status: 500 }); }
}
