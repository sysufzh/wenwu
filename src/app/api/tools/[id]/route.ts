import { NextRequest, NextResponse } from 'next/server';
import { getToolById, updateTool, deleteTool } from '@/db/tools';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tool = getToolById(parseInt(id));
    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }
    return NextResponse.json(tool);
  } catch (error) {
    return NextResponse.json({ error: '获取工具详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tool = updateTool(parseInt(id), body);
    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }
    return NextResponse.json(tool);
  } catch (error) {
    return NextResponse.json({ error: '更新工具失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteTool(parseInt(id));
    if (!success) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除工具失败' }, { status: 500 });
  }
}
