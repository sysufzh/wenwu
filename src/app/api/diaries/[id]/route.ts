import { NextRequest, NextResponse } from 'next/server';
import { getDiaryById, deleteDiary, updateDiary, DiaryCreateInput } from '@/db/diaries';
import { getSession } from '@/lib/auth';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as DiaryCreateInput;
    if (!body.content) {
      return NextResponse.json({ error: '日记内容不能为空' }, { status: 400 });
    }
    const diary = updateDiary(parseInt(id), body);
    if (!diary) return NextResponse.json({ error: '日记不存在' }, { status: 404 });
    return NextResponse.json(diary);
  } catch (error) {
    return NextResponse.json({ error: '更新日记失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: '无权限，仅管理员可删除日记' }, { status: 403 });
    }
    const { id } = await params;
    const ok = deleteDiary(parseInt(id));
    if (!ok) return NextResponse.json({ error: '日记不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除日记失败' }, { status: 500 });
  }
}
