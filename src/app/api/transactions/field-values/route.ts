import { NextRequest, NextResponse } from 'next/server';
import { getDistinctFieldValues } from '@/db/transactions';

export async function GET(request: NextRequest) {
  const ledgerType = request.nextUrl.searchParams.get('ledgerType') as '生活' | '工作' | null;
  const data = getDistinctFieldValues(ledgerType || undefined);
  return NextResponse.json(data);
}
