import { NextRequest, NextResponse } from 'next/server';
import { getRecords, RecordsListParams } from '@/db/records';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type') || '';
    const params: RecordsListParams = {
      type: (typeParam === 'checkout' || typeParam === 'checkin') ? typeParam : '',
      person: searchParams.get('person') || '',
      dateFrom: searchParams.get('date_from') || '',
      dateTo: searchParams.get('date_to') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    const result = getRecords(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '查询记录失败' }, { status: 500 });
  }
}
