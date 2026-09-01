import { NextRequest, NextResponse } from 'next/server';
import { getFeatureById, updateFeature, deleteFeature, FeatureInput } from '@/db/excavation';
import { getSession } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const feature = getFeatureById(parseInt(id));
    if (!feature) return NextResponse.json({ error: '遗迹不存在' }, { status: 404 });
    return NextResponse.json(feature);
  } catch (error) {
    return NextResponse.json({ error: '获取遗迹失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as FeatureInput;
    const feature = updateFeature(parseInt(id), body);
    if (!feature) return NextResponse.json({ error: '遗迹不存在' }, { status: 404 });
    return NextResponse.json(feature);
  } catch (error) {
    return NextResponse.json({ error: '更新遗迹失败' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: '无权限，仅管理员可删除遗迹' }, { status: 403 });
    }
    const { id } = await params;
    const ok = deleteFeature(parseInt(id));
    if (!ok) return NextResponse.json({ error: '遗迹不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除遗迹失败' }, { status: 500 });
  }
}
