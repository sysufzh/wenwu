import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { DB_PATH } from '@/db';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: '仅管理员可备份' }, { status: 403 });
    }

    ensureBackupDir();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `wenwu-${timestamp}.db`);

    fs.copyFileSync(DB_PATH, backupPath);

    return NextResponse.json({ success: true, file: `wenwu-${timestamp}.db` });
  } catch (error) {
    return NextResponse.json({ error: '备份失败' }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db'))
      .sort()
      .reverse()
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: stat.size,
          createdAt: stat.birthtime,
        };
      });

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 });
  }
}
