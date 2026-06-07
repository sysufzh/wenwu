import { NextRequest, NextResponse } from 'next/server';
import { getTools, createTool, ToolListParams } from '@/db/tools';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status') || '';
    const params: ToolListParams = {
      search: searchParams.get('search') || '',
      status: (statusParam === '在库' || statusParam === '出库') ? statusParam : '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    const result = getTools(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取工具列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.tool_name) {
      return NextResponse.json({ error: '工具名称不能为空' }, { status: 400 });
    }
    const tool = createTool(body);
    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建工具失败' }, { status: 500 });
  }
}
