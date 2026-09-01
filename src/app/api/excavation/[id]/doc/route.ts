import { NextRequest, NextResponse } from 'next/server';
import { getFeatureById, FeatureWithChildren } from '@/db/excavation';
import { buildExcavationRecord } from '@/lib/docx/excavationRecord';
import { buildExcavationRecordTable } from '@/lib/docx/excavationRecordTable';
import { buildFeatureRegisterTable } from '@/lib/docx/featureRegisterTable';
import { buildDepositRecordTable } from '@/lib/docx/depositRecordTable';
import { Packer } from 'docx';

type DocType = 'record' | 'record_table' | 'feature_register' | 'deposit';

const BUILDER: Record<DocType, (f: FeatureWithChildren) => ReturnType<typeof buildExcavationRecord>> = {
  record: buildExcavationRecord,
  record_table: buildExcavationRecordTable,
  feature_register: buildFeatureRegisterTable,
  deposit: buildDepositRecordTable,
};

const FILENAME: Record<DocType, string> = {
  record: '发掘记录',
  record_table: '发掘记录表',
  feature_register: '遗迹登记表',
  deposit: '堆积记录表',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const type = (request.nextUrl.searchParams.get('type') || 'record') as DocType;

    const feature = getFeatureById(parseInt(id));
    if (!feature) return NextResponse.json({ error: '遗迹不存在' }, { status: 404 });
    if (!BUILDER[type]) return NextResponse.json({ error: '未知文档类型' }, { status: 400 });

    const doc = BUILDER[type](feature);
    const buffer = await Packer.toBuffer(doc);
    const body = new Uint8Array(buffer);

    const baseName = `${feature.trench_number}${feature.feature_number}${FILENAME[type]}`;
    const asciiName = `${feature.trench_number}${feature.feature_number}.docx`;
    const encoded = encodeURIComponent(`${baseName}.docx`);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '生成文档失败' }, { status: 500 });
  }
}
