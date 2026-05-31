import { NextRequest, NextResponse } from 'next/server';
import { getRelics, createRelic, RelicListParams } from '@/db/relics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status') || '';
    const params: RelicListParams = {
      search: searchParams.get('search') || '',
      status: (statusParam === '在库' || statusParam === '出库') ? statusParam : '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    const result = getRelics(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取文物列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.artifact_name) {
      return NextResponse.json({ error: '器物名不能为空' }, { status: 400 });
    }
    const relic = createRelic(body);
    return NextResponse.json(relic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建文物失败' }, { status: 500 });
  }
}
