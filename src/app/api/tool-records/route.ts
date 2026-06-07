import { NextRequest, NextResponse } from 'next/server';
import { getToolRecords } from '@/db/tools';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type') || '';
    const result = getToolRecords({
      type: (typeParam === 'checkout' || typeParam === 'checkin') ? typeParam : '',
      person: searchParams.get('person') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 });
  }
}
