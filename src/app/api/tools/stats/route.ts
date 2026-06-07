import { NextResponse } from 'next/server';
import { getToolStats } from '@/db/tools';

export async function GET() {
  try {
    const stats = getToolStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}
