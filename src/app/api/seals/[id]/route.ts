import { NextRequest, NextResponse } from 'next/server';
import { getSealUsageById, updateSealUsage, deleteSealUsage } from '@/db/seal';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const r = getSealUsageById(parseInt(id));
    if (!r) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json(r);
  } catch { return NextResponse.json({ error: '获取失败' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const r = updateSealUsage(parseInt(id), body);
    if (!r) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json(r);
  } catch { return NextResponse.json({ error: '更新失败' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!deleteSealUsage(parseInt(id))) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: '删除失败' }, { status: 500 }); }
}
