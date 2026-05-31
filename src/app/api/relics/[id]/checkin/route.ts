import { NextRequest, NextResponse } from 'next/server';
import { checkinRelic } from '@/db/records';
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
    if (relic.status !== '出库') {
      return NextResponse.json({ error: '该文物当前不在出库状态' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.checkin_person) {
      return NextResponse.json({ error: '入库经办人不能为空' }, { status: 400 });
    }
    if (!body.checkout_record_id) {
      return NextResponse.json({ error: '缺少关联的出库记录ID' }, { status: 400 });
    }

    const record = checkinRelic(
      relicId,
      body.checkout_record_id,
      body.checkin_person,
      body.condition_notes,
      body.remarks,
      body.checkin_time
    );
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '入库操作失败' }, { status: 500 });
  }
}
