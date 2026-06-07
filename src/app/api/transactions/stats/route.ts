import { NextResponse } from 'next/server';
import { getTransactionStats } from '@/db/transactions';

export async function GET() {
  try {
    const stats = getTransactionStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}
