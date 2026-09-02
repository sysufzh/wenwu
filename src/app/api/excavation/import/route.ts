import { NextRequest, NextResponse } from 'next/server';
import { importFeatureFromDiaries } from '@/db/featureImport';

export async function GET(request: NextRequest) {
  try {
    const featureNumber = request.nextUrl.searchParams.get('feature_number') || '';
    if (!featureNumber) {
      return NextResponse.json({ error: '缺少遗迹号' }, { status: 400 });
    }
    const result = importFeatureFromDiaries(featureNumber);
    if (!result) {
      return NextResponse.json({ error: '未找到相关日记' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '导入失败' }, { status: 500 });
  }
}
