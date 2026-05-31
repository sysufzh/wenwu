import { NextRequest, NextResponse } from 'next/server';
import { getRelicById, updateRelic, deleteRelic } from '@/db/relics';
import { getRelicHistory } from '@/db/records';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relicId = parseInt(id);
    if (isNaN(relicId)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const history = getRelicHistory(relicId);
    if (!history.relic) {
      return NextResponse.json({ error: '文物不存在' }, { status: 404 });
    }

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: '获取文物详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relicId = parseInt(id);
    if (isNaN(relicId)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const body = await request.json();
    const relic = updateRelic(relicId, body);
    if (!relic) {
      return NextResponse.json({ error: '文物不存在' }, { status: 404 });
    }
    return NextResponse.json(relic);
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relicId = parseInt(id);
    if (isNaN(relicId)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const success = deleteRelic(relicId);
    if (!success) {
      return NextResponse.json({ error: '文物不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
