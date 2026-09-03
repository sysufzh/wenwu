import { NextRequest, NextResponse } from 'next/server';
import { getDiaryById } from '@/db/diaries';
import { buildDiaryDoc } from '@/lib/docx/diary';
import { Packer } from 'docx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const diary = getDiaryById(parseInt(id));
    if (!diary) return NextResponse.json({ error: '日记不存在' }, { status: 404 });

    const doc = buildDiaryDoc(diary);
    const buffer = await Packer.toBuffer(doc);
    const body = new Uint8Array(buffer);

    const asciiName = `diary_${id}.docx`;
    const encoded = encodeURIComponent(`${diary.diary_date}_${diary.trench_number || ''}_考古日记.docx`);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`,
      },
    });
  } catch {
    return NextResponse.json({ error: '生成文档失败' }, { status: 500 });
  }
}
