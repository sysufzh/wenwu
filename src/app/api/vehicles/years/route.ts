import { NextResponse } from 'next/server';
import { getVehicleUsageYears } from '@/db/vehicle';

export async function GET() {
  try {
    const years = getVehicleUsageYears();
    return NextResponse.json({ data: years });
  } catch {
    return NextResponse.json({ error: '获取年份失败' }, { status: 500 });
  }
}
