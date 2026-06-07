import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStats } from '@/db/transactions';

export async function GET(request: NextRequest) {
  try {
    const ledgerParam = request.nextUrl.searchParams.get('ledgerType') || '';
    const ledgerType = (ledgerParam === '生活' || ledgerParam === '工作') ? ledgerParam : undefined;
    const stats = getTransactionStats(ledgerType);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}
