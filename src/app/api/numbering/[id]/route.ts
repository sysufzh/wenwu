import { NextRequest, NextResponse } from 'next/server';
import {
  getNumberingRequestById,
  approveRequest,
  rejectRequest,
  applyCancel,
  approveCancel,
  rejectCancel,
  undoCancel,
  updateNumberingRequest,
} from '@/db/numbering';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await params;
    const r = getNumberingRequestById(parseInt(id));
    if (!r) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json(r);
  } catch { return NextResponse.json({ error: '获取失败' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const reviewer = session.displayName || session.username;
    const isAdmin = session.role === 'admin';
    const nid = parseInt(id);

    const forbid = () => NextResponse.json({ error: '无权限' }, { status: 403 });

    switch (body.action) {
      case 'approve': {
        if (!isAdmin) return forbid();
        const r = approveRequest(nid, reviewer);
        if (!r) return NextResponse.json({ error: '无法通过该申请' }, { status: 400 });
        return NextResponse.json(r);
      }
      case 'reject': {
        if (!isAdmin) return forbid();
        if (!body.reject_reason || !body.reject_reason.trim()) {
          return NextResponse.json({ error: '请填写驳回原因' }, { status: 400 });
        }
        const r = rejectRequest(nid, reviewer, body.reject_reason.trim());
        if (!r) return NextResponse.json({ error: '无法驳回该申请' }, { status: 400 });
        return NextResponse.json(r);
      }
      case 'cancel-apply': {
        const r = applyCancel(nid);
        if (!r) return NextResponse.json({ error: '无法申请销号' }, { status: 400 });
        return NextResponse.json(r);
      }
      case 'cancel-approve': {
        if (!isAdmin) return forbid();
        const r = approveCancel(nid, reviewer);
        if (!r) return NextResponse.json({ error: '无法通过销号' }, { status: 400 });
        return NextResponse.json(r);
      }
      case 'cancel-reject': {
        if (!isAdmin) return forbid();
        const r = rejectCancel(nid);
        if (!r) return NextResponse.json({ error: '无法驳回销号' }, { status: 400 });
        return NextResponse.json(r);
      }
      case 'undo-cancel': {
        if (!isAdmin) return forbid();
        const r = undoCancel(nid);
        if (!r) return NextResponse.json({ error: '无法撤销销号' }, { status: 400 });
        return NextResponse.json(r);
      }
      default: {
        if (!isAdmin) return forbid();
        const r = updateNumberingRequest(nid, body);
        if (!r) return NextResponse.json({ error: '无法编辑该记录' }, { status: 400 });
        return NextResponse.json(r);
      }
    }
  } catch { return NextResponse.json({ error: '操作失败' }, { status: 500 }); }
}
