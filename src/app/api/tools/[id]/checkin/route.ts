import { NextRequest, NextResponse } from 'next/server';
import { checkinTool } from '@/db/tools';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.checkin_person) {
      return NextResponse.json({ error: '经办人不能为空' }, { status: 400 });
    }
    if (!body.checkout_record_id) {
      return NextResponse.json({ error: '需指定对应的出库记录' }, { status: 400 });
    }
    const record = checkinTool(
      parseInt(id),
      body.checkout_record_id,
      body.checkin_person,
      body.condition_notes,
      body.remarks,
      body.checkin_time || undefined,
      body.checkin_quantity ? parseInt(body.checkin_quantity) : undefined
    );
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '工具入库失败' }, { status: 500 });
  }
}
