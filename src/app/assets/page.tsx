'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface FixedAsset {
  id: number;
  asset_number: string;
  asset_name: string;
  quantity: number;
  brand: string;
  model_spec: string;
  production_date: string;
  entry_date: string;
  original_value: number;
  user_name: string;
  department: string;
  location: string;
  remarks: string;
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <AssetsContent />
    </Suspense>
  );
}

function AssetsContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<FixedAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    asset_number: '',
    asset_name: '',
    quantity: 1,
    brand: '',
    model_spec: '',
    production_date: '',
    entry_date: '',
    original_value: '',
    user_name: '',
    department: '',
    location: '',
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
    p.set('page', String(page));
    const res = await fetch(`/api/assets?${p}`);
    const data = await res.json();
    setRecords(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_name.trim()) { alert('资产名称不能为空'); return; }
    setSaving(true);
    const res = await fetch('/api/assets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantity: form.quantity || 1, original_value: parseFloat(form.original_value) || 0 }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ asset_number: '', asset_name: '', quantity: 1, brand: '', model_spec: '', production_date: '', entry_date: '', original_value: '', user_name: '', department: '', location: '', remarks: '' });
      fetchRecords();
    } else { alert((await res.json()).error || '创建失败'); }
    setSaving(false);
  };

  const formatMoney = (v: number) => v ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-';

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-800">固定资产登记</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">+ 新建资产</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">资产编号</label>
              <input value={form.asset_number} onChange={e => setForm(p => ({ ...p, asset_number: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">资产名称 <span className="text-red-500">*</span></label>
              <input required value={form.asset_name} onChange={e => setForm(p => ({ ...p, asset_name: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">数量</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">品牌</label>
              <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">规格型号</label>
              <input value={form.model_spec} onChange={e => setForm(p => ({ ...p, model_spec: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">生产日期</label>
              <input type="date" value={form.production_date} onChange={e => setForm(p => ({ ...p, production_date: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">入账日期</label>
              <input type="date" value={form.entry_date} onChange={e => setForm(p => ({ ...p, entry_date: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">原值</label>
              <input type="number" step="0.01" min="0" value={form.original_value} onChange={e => setForm(p => ({ ...p, original_value: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">使用人</label>
              <input value={form.user_name} onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">使用部门</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">存放地点</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">备注</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-amber-700 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-800 disabled:opacity-50">{saving ? '保存中…' : '保存'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded text-sm border border-stone-300 text-stone-600 hover:bg-stone-50">取消</button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <input type="text" placeholder="搜索资产名称、编号、品牌、使用人…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-stone-600">编号</th>
                <th className="text-left px-3 py-3 font-medium text-stone-600">名称</th>
                <th className="text-center px-3 py-3 font-medium text-stone-600 hidden sm:table-cell">数量</th>
                <th className="text-left px-3 py-3 font-medium text-stone-600 hidden md:table-cell">品牌</th>
                <th className="text-left px-3 py-3 font-medium text-stone-600 hidden lg:table-cell">规格</th>
                <th className="text-right px-3 py-3 font-medium text-stone-600 hidden md:table-cell">原值</th>
                <th className="text-left px-3 py-3 font-medium text-stone-600 hidden sm:table-cell">使用人</th>
                <th className="text-right px-3 py-3 font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">暂无记录</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-3 py-3 text-stone-600 text-xs whitespace-nowrap">{r.asset_number || '-'}</td>
                  <td className="px-3 py-3 font-medium text-stone-800 whitespace-nowrap">{r.asset_name}</td>
                  <td className="px-3 py-3 text-stone-600 text-center hidden sm:table-cell">{r.quantity}</td>
                  <td className="px-3 py-3 text-stone-600 hidden md:table-cell">{r.brand || '-'}</td>
                  <td className="px-3 py-3 text-stone-600 hidden lg:table-cell text-xs">{r.model_spec || '-'}</td>
                  <td className="px-3 py-3 text-stone-600 text-right hidden md:table-cell">{formatMoney(r.original_value)}</td>
                  <td className="px-3 py-3 text-stone-600 hidden sm:table-cell">{r.user_name || '-'}</td>
                  <td className="px-3 py-3 text-right">{isAdmin && <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>}</td>
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
