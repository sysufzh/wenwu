import { NextResponse } from 'next/server';
import { getTrenchNumbers } from '@/db/diaries';

export async function GET() {
  try {
    return NextResponse.json({ data: getTrenchNumbers() });
  } catch (error) {
    return NextResponse.json({ error: '获取探方号失败' }, { status: 500 });
  }
}
