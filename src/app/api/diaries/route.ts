import { NextRequest, NextResponse } from 'next/server';
import { getDiaries, createDiary } from '@/db/diaries';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = getDiaries({
      page: parseInt(sp.get('page') || '1'),
      limit: parseInt(sp.get('limit') || '20'),
      dateFrom: sp.get('dateFrom') || '',
      dateTo: sp.get('dateTo') || '',
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取日记列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.content) {
      return NextResponse.json({ error: '日记内容不能为空' }, { status: 400 });
    }
    const diary = createDiary(body);
    return NextResponse.json(diary, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '保存日记失败' }, { status: 500 });
  }
}
