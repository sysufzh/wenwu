'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SealUsage {
  id: number;
  usage_date: string;
  purpose: string;
  seal_count: number;
  user_name: string;
  remarks: string;
}

export default function SealsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <SealsContent />
    </Suspense>
  );
}

function SealsContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<SealUsage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    usage_date: new Date().toISOString().slice(0, 10),
    purpose: '',
    seal_count: 1,
    user_name: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.role === 'admin') setIsAdmin(true); });
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    p.set('page', String(page));
    const res = await fetch(`/api/seals?${p}`);
    const data = await res.json();
    setRecords(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/seals/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/seals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowForm(false);
      setForm({ usage_date: new Date().toISOString().slice(0, 10), purpose: '', seal_count: 1, user_name: '', remarks: '' });
      fetchRecords();
    } else { alert((await res.json()).error || '创建失败'); }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-800">公章使用登记</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">+ 新建记录</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">日期 <span className="text-red-500">*</span></label>
              <input required type="date" value={form.usage_date} onChange={e => setForm(p => ({ ...p, usage_date: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">用章事项</label>
              <input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="用章事由" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">盖章数量</label>
              <input type="number" min={1} value={form.seal_count} onChange={e => setForm(p => ({ ...p, seal_count: parseInt(e.target.value) || 1 }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">盖章人</label>
              <input value={form.user_name} onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">备注</label>
            <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-amber-700 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-800 disabled:opacity-50">{saving ? '保存中…' : '保存'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded text-sm border border-stone-300 text-stone-600 hover:bg-stone-50">取消</button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <input type="text" placeholder="搜索事项、盖章人…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">日期</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">用章事项</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">盖章数量</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">盖章人</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-stone-400">暂无记录</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{r.usage_date}</td>
                  <td className="px-4 py-3 text-stone-800">{r.purpose || '-'}</td>
                  <td className="px-4 py-3 text-center text-stone-600">{r.seal_count}</td>
                  <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{r.user_name || '-'}</td>
                  <td className="px-4 py-3 text-right">{isAdmin && <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>}</td>
                </tr>
              ))}
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
