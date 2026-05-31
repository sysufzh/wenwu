import { NextResponse } from 'next/server';
import { getRelicStats } from '@/db/relics';

export async function GET() {
  try {
    const stats = getRelicStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: '获取统计信息失败' }, { status: 500 });
  }
}
