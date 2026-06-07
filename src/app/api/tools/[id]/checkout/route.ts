import { NextRequest, NextResponse } from 'next/server';
import { checkoutTool } from '@/db/tools';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.checkout_person) {
      return NextResponse.json({ error: '经办人不能为空' }, { status: 400 });
    }
    const record = checkoutTool(
      parseInt(id),
      body.checkout_person,
      body.purpose,
      body.checkout_time || undefined
    );
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '工具出库失败' }, { status: 500 });
  }
}
