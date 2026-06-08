import { NextRequest, NextResponse } from 'next/server';
import { getFixedAssets, createFixedAsset } from '@/db/assets';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = getFixedAssets({
      search: sp.get('search') || '',
      department: sp.get('department') || '',
      page: parseInt(sp.get('page') || '1'),
      limit: parseInt(sp.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: '获取记录失败' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.asset_name) return NextResponse.json({ error: '资产名称不能为空' }, { status: 400 });
    const record = createFixedAsset(body);
    return NextResponse.json(record, { status: 201 });
  } catch { return NextResponse.json({ error: '创建失败' }, { status: 500 }); }
}
