import { NextRequest, NextResponse } from 'next/server';
import { getFixedAssetById, updateFixedAsset, deleteFixedAsset } from '@/db/assets';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const r = getFixedAssetById(parseInt(id));
    if (!r) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json(r);
  } catch { return NextResponse.json({ error: '获取失败' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const r = updateFixedAsset(parseInt(id), body);
    if (!r) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json(r);
  } catch { return NextResponse.json({ error: '更新失败' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!deleteFixedAsset(parseInt(id))) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: '删除失败' }, { status: 500 }); }
}
