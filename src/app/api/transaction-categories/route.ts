import { NextResponse } from 'next/server';
import { getCategories } from '@/db/transactions';

export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 });
  }
}
