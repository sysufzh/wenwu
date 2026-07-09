import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '未选择文件' }, { status: 400 });

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ path: `/uploads/${filename}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '上传失败' }, { status: 500 });
  }
}
