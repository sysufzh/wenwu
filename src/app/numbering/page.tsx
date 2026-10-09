'use client';

import { useState, useEffect, useCallback, Suspense, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';

const NUMBERING_CATEGORIES = ['灰坑', '灰沟', '墓葬', '柱洞', '房子', '灶', '烧土遗迹', '石块堆积'];

interface NumberingRequest {
  id: number;
  category: string;
  trench_number: string;
  position: string;
  shape: string;
  opening_size: string;
  soil_texture: string;
  soil_color: string;
  inclusions: string;
  stratigraphy: string;
  remarks: string;
  applicant: string;
  apply_date: string;
  status: '待审批' | '已通过' | '已驳回' | '占号' | '待销号' | '已销号';
  assigned_number: string;
  reviewer: string;
  review_date: string;
  reject_reason: string;
}

export default function NumberingPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <NumberingContent />
    </Suspense>
  );
}

const emptyForm = {
  category: '灰坑',
  trench_number: '',
  position: '',
  shape: '',
  opening_size: '',
  soil_texture: '',
  soil_color: '',
  inclusions: '',
  stratigraphy: '',
  remarks: '',
};

const statusBadge: Record<string, string> = {
  '待审批': 'bg-amber-50 text-amber-700',
  '已通过': 'bg-green-50 text-green-700',
  '已驳回': 'bg-red-50 text-red-700',
  '占号': 'bg-blue-50 text-blue-700',
  '待销号': 'bg-orange-50 text-orange-700',
  '已销号': 'bg-stone-100 text-stone-500',
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-stone-700 whitespace-pre-wrap">{value || '—'}</div>
    </div>
  );
}

function NumberingContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<NumberingRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.role === 'admin') setIsAdmin(true);
      setDisplayName(d.displayName || d.username || '');
    });
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (statusFilter) p.set('status', statusFilter);
    p.set('page', String(page));
    const res = await fetch(`/api/numbering?${p}`);
    const data = await res.json();
    setRecords(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const transition = async (id: number, action: string, extra?: Record<string, unknown>) => {
    const res = await fetch(`/api/numbering/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) fetchRecords();
    else alert((await res.json()).error || '操作失败');
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (r: NumberingRequest) => {
    setEditingId(r.id);
    setForm({
      category: r.category,
      trench_number: r.trench_number,
      position: r.position,
      shape: r.shape,
      opening_size: r.opening_size,
      soil_texture: r.soil_texture,
      soil_color: r.soil_color,
      inclusions: r.inclusions,
      stratigraphy: r.stratigraphy,
      remarks: r.remarks,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      const res = await fetch(`/api/numbering/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchRecords();
      } else { alert((await res.json()).error || '保存失败'); }
    } else {
      const res = await fetch('/api/numbering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(emptyForm);
        fetchRecords();
      } else { alert((await res.json()).error || '提交失败'); }
    }
    setSaving(false);
  };

  const handleReject = (id: number) => {
    const reason = prompt('请输入驳回原因');
    if (reason === null) return;
    if (!reason.trim()) { alert('驳回原因不能为空'); return; }
    transition(id, 'reject', { reject_reason: reason.trim() });
  };

  const inputCls = 'w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const labelCls = 'block text-xs font-medium text-stone-600 mb-1';
  const btn = (cls: string) => `text-xs px-2 py-1 rounded ${cls}`;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-800">田野考古给号系统</h2>
        <button onClick={handleOpenNew} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">+ 申请给号</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="text-sm font-medium text-stone-700 mb-1">{editingId ? '编辑 / 填写记录' : '申请给号'}</div>
          {editingId && <div className="text-xs text-stone-500">填写「占号」记录后保存将自动转为「已通过」。</div>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>类别 <span className="text-red-500">*</span></label>
              {editingId ? (
                <input value={form.category} readOnly className="w-full px-2 py-1.5 border rounded text-sm bg-stone-50 text-stone-500" />
              ) : (
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                  {NUMBERING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={labelCls}>探方号</label>
              <input value={form.trench_number} onChange={e => setForm(p => ({ ...p, trench_number: e.target.value }))} className={inputCls} placeholder="如T1" />
            </div>
            <div>
              <label className={labelCls}>遗迹位置</label>
              <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className={inputCls} placeholder="如T1西北角" />
            </div>
            <div>
              <label className={labelCls}>开口形状</label>
              <input value={form.shape} onChange={e => setForm(p => ({ ...p, shape: e.target.value }))} className={inputCls} placeholder="如近圆形" />
            </div>
            <div>
              <label className={labelCls}>尺寸</label>
              <input value={form.opening_size} onChange={e => setForm(p => ({ ...p, opening_size: e.target.value }))} className={inputCls} placeholder="如口径1.2米" />
            </div>
            <div>
              <label className={labelCls}>填土土质</label>
              <input value={form.soil_texture} onChange={e => setForm(p => ({ ...p, soil_texture: e.target.value }))} className={inputCls} placeholder="如砂质黏土" />
            </div>
            <div>
              <label className={labelCls}>土色</label>
              <input value={form.soil_color} onChange={e => setForm(p => ({ ...p, soil_color: e.target.value }))} className={inputCls} placeholder="如灰褐色" />
            </div>
            <div>
              <label className={labelCls}>包含物</label>
              <input value={form.inclusions} onChange={e => setForm(p => ({ ...p, inclusions: e.target.value }))} className={inputCls} placeholder="如陶片、红烧土" />
            </div>
            <div>
              <label className={labelCls}>层位关系</label>
              <input value={form.stratigraphy} onChange={e => setForm(p => ({ ...p, stratigraphy: e.target.value }))} className={inputCls} placeholder="如开口于②层下" />
            </div>
            <div>
              <label className={labelCls}>备注/说明</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className={inputCls} />
            </div>
            {!editingId && (
              <div>
                <label className={labelCls}>申请人</label>
                <input value={displayName} readOnly className="w-full px-2 py-1.5 border rounded text-sm bg-stone-50 text-stone-500" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-amber-700 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-800 disabled:opacity-50">{saving ? '保存中…' : (editingId ? '保存' : '提交申请')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-1.5 rounded text-sm border border-stone-300 text-stone-600 hover:bg-stone-50">取消</button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <input type="text" placeholder="搜索探方号、位置、编号、申请人…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">全部状态</option>
          <option value="待审批">待审批</option>
          <option value="已通过">已通过</option>
          <option value="已驳回">已驳回</option>
          <option value="占号">占号</option>
          <option value="待销号">待销号</option>
          <option value="已销号">已销号</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">类别</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">编号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">探方号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">位置</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">申请人</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">申请日期</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">状态</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">暂无记录</td></tr>
              ) : records.map(r => {
                if (r.status === '已销号') {
                  return (
                    <tr key={r.id} className="hover:bg-stone-50 opacity-60">
                      <td colSpan={2} className="px-4 py-3 text-stone-400 whitespace-nowrap">{r.assigned_number}</td>
                      <td colSpan={5} className="px-4 py-3 text-stone-400">已销号</td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <button onClick={() => transition(r.id, 'undo-cancel')} className={btn('bg-stone-100 text-stone-700 hover:bg-stone-200')}>撤销销号</button>
                        )}
                      </td>
                    </tr>
                  );
                }

                const open = detailId === r.id;
                const numbered = r.status === '已通过' || r.status === '占号';
                return (
                  <Fragment key={r.id}>
                    <tr className="hover:bg-stone-50 align-top">
                      <td className="px-4 py-3 text-stone-800 font-medium whitespace-nowrap">{r.category}</td>
                      <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">{r.assigned_number || '—'}</td>
                      <td className="px-4 py-3 text-stone-600 hidden sm:table-cell whitespace-nowrap">{r.trench_number || '-'}</td>
                      <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">{r.position || '-'}</td>
                      <td className="px-4 py-3 text-stone-600 hidden sm:table-cell whitespace-nowrap">{r.applicant || '-'}</td>
                      <td className="px-4 py-3 text-stone-600 hidden md:table-cell whitespace-nowrap">{r.apply_date || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[r.status] || 'bg-stone-100 text-stone-600'}`}>{r.status}</span>
                        {r.status === '已驳回' && r.reject_reason && (
                          <div className="text-xs text-red-600 mt-1">{r.reject_reason}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <button onClick={() => setDetailId(open ? null : r.id)} className={btn('bg-stone-100 text-stone-700 hover:bg-stone-200')}>{open ? '收起' : '详情'}</button>
                          {r.status === '待审批' && isAdmin && (
                            <>
                              <button onClick={() => transition(r.id, 'approve')} className={btn('bg-green-50 text-green-700 hover:bg-green-100')}>通过</button>
                              <button onClick={() => handleReject(r.id)} className={btn('bg-red-50 text-red-700 hover:bg-red-100')}>驳回</button>
                            </>
                          )}
                          {numbered && (
                            <button onClick={() => transition(r.id, 'cancel-apply')} className={btn('bg-orange-50 text-orange-700 hover:bg-orange-100')}>申请销号</button>
                          )}
                          {numbered && isAdmin && (
                            <button onClick={() => handleEdit(r)} className={btn('bg-stone-100 text-stone-700 hover:bg-stone-200')}>编辑</button>
                          )}
                          {r.status === '待销号' && isAdmin && (
                            <>
                              <button onClick={() => transition(r.id, 'cancel-approve')} className={btn('bg-green-50 text-green-700 hover:bg-green-100')}>通过销号</button>
                              <button onClick={() => transition(r.id, 'cancel-reject')} className={btn('bg-red-50 text-red-700 hover:bg-red-100')}>驳回销号</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-stone-50/50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                            <DetailItem label="开口形状" value={r.shape} />
                            <DetailItem label="尺寸" value={r.opening_size} />
                            <DetailItem label="填土土质" value={r.soil_texture} />
                            <DetailItem label="土色" value={r.soil_color} />
                            <DetailItem label="包含物" value={r.inclusions} />
                            <DetailItem label="层位关系" value={r.stratigraphy} />
                            <DetailItem label="备注" value={r.remarks} />
                            <DetailItem label="给号人" value={r.reviewer} />
                            <DetailItem label="给号日期" value={r.review_date} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-stone-500">共 {total} 条</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border disabled:opacity-30 hover:bg-stone-100">上一页</button>
              <span className="px-3 py-1 text-stone-600">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border disabled:opacity-30 hover:bg-stone-100">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
