import { NextResponse } from 'next/server';
import { getDistinctFieldValues, getLastRelic } from '@/db/relics';

export async function GET() {
  try {
    const values = getDistinctFieldValues();
    const lastRelic = getLastRelic();
    return NextResponse.json({
      ...values,
      lastUsed: lastRelic ? {
        warehouse_number: lastRelic.warehouse_number,
        shelf_number: lastRelic.shelf_number,
        material: lastRelic.material,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({ error: '获取字段值失败' }, { status: 500 });
  }
}
