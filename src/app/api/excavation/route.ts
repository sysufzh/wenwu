import { NextRequest, NextResponse } from 'next/server';
import { getFeatures, createFeature, FeatureInput } from '@/db/excavation';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = getFeatures({
      search: sp.get('search') || '',
      page: parseInt(sp.get('page') || '1'),
      limit: parseInt(sp.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取遗迹列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeatureInput;
    if (!body.feature_number) {
      return NextResponse.json({ error: '遗迹号不能为空' }, { status: 400 });
    }
    const feature = createFeature(body);
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '保存遗迹失败' }, { status: 500 });
  }
}
