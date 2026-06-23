import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStats } from '@/db/transactions';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const ledgerParam = sp.get('ledgerType') || '';
    const ledgerType = (ledgerParam === '生活' || ledgerParam === '工作') ? ledgerParam : undefined;
    const dateFrom = sp.get('dateFrom') || '';
    const dateTo = sp.get('dateTo') || '';
    const stats = getTransactionStats(ledgerType, dateFrom, dateTo);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}
