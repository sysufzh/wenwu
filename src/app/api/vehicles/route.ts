import { NextRequest, NextResponse } from 'next/server';
import { getVehicleUsages, createVehicleUsage } from '@/db/vehicle';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = getVehicleUsages({
      search: sp.get('search') || '',
      dateFrom: sp.get('dateFrom') || '',
      dateTo: sp.get('dateTo') || '',
      page: parseInt(sp.get('page') || '1'),
      limit: parseInt(sp.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: '获取记录失败' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.license_plate) return NextResponse.json({ error: '车牌号不能为空' }, { status: 400 });
    if (!body.usage_date) return NextResponse.json({ error: '日期不能为空' }, { status: 400 });
    const record = createVehicleUsage(body);
    return NextResponse.json(record, { status: 201 });
  } catch { return NextResponse.json({ error: '创建失败' }, { status: 500 }); }
}
