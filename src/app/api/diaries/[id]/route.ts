import { NextRequest, NextResponse } from 'next/server';
import { getDiaryById, deleteDiary } from '@/db/diaries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const diary = getDiaryById(parseInt(id));
    if (!diary) return NextResponse.json({ error: '日记不存在' }, { status: 404 });
    return NextResponse.json(diary);
  } catch (error) {
    return NextResponse.json({ error: '获取日记失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = deleteDiary(parseInt(id));
    if (!ok) return NextResponse.json({ error: '日记不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除日记失败' }, { status: 500 });
  }
}
