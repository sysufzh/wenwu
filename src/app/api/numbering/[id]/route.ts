import { NextRequest, NextResponse } from 'next/server';
import {
  getNumberingRequestById,
  approveRequest,
  rejectRequest,
  deleteNumberingRequest,
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
    if (session.role !== 'admin') return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const reviewer = session.displayName || session.username;

    if (body.action === 'approve') {
      const r = approveRequest(parseInt(id), reviewer);
      if (!r) return NextResponse.json({ error: '无法通过该申请' }, { status: 400 });
      return NextResponse.json(r);
    }

    if (body.action === 'reject') {
      if (!body.reject_reason || !body.reject_reason.trim()) {
        return NextResponse.json({ error: '请填写驳回原因' }, { status: 400 });
      }
      const r = rejectRequest(parseInt(id), reviewer, body.reject_reason.trim());
      if (!r) return NextResponse.json({ error: '无法驳回该申请' }, { status: 400 });
      return NextResponse.json(r);
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch { return NextResponse.json({ error: '操作失败' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { id } = await params;
    const existing = getNumberingRequestById(parseInt(id));
    if (!existing) return NextResponse.json({ error: '记录不存在' }, { status: 404 });

    const isAdmin = session.role === 'admin';
    const isOwnPending = existing.status === '待审批' && existing.applicant === (session.displayName || session.username);
    if (!isAdmin && !isOwnPending) return NextResponse.json({ error: '无权限' }, { status: 403 });

    if (!deleteNumberingRequest(parseInt(id))) return NextResponse.json({ error: '删除失败' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: '删除失败' }, { status: 500 }); }
}
