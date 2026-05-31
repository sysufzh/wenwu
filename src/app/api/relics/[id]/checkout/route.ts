import { NextRequest, NextResponse } from 'next/server';
import { checkoutRelic } from '@/db/records';
import { getRelicById } from '@/db/relics';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relicId = parseInt(id);
    if (isNaN(relicId)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    const relic = getRelicById(relicId);
    if (!relic) {
      return NextResponse.json({ error: '文物不存在' }, { status: 404 });
    }
    if (relic.status === '出库') {
      return NextResponse.json({ error: '该文物已在出库状态，请先入库再操作' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.checkout_person) {
      return NextResponse.json({ error: '出库经办人不能为空' }, { status: 400 });
    }

    const record = checkoutRelic(relicId, body.checkout_person, body.purpose, body.checkout_time);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '出库操作失败' }, { status: 500 });
  }
}
