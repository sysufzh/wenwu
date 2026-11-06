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

const emptyForm = {
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
};

const ASSET_FIELDS: { key: keyof FixedAsset; label: string }[] = [
  { key: 'asset_number', label: '资产编号' },
  { key: 'asset_name', label: '资产名称' },
  { key: 'quantity', label: '数量' },
  { key: 'brand', label: '品牌' },
  { key: 'model_spec', label: '规格型号' },
  { key: 'production_date', label: '生产日期' },
  { key: 'entry_date', label: '入账日期' },
  { key: 'original_value', label: '原值' },
  { key: 'user_name', label: '使用人' },
  { key: 'department', label: '使用部门' },
  { key: 'location', label: '存放地点' },
  { key: 'remarks', label: '备注' },
];

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [detailItem, setDetailItem] = useState<FixedAsset | null>(null);

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

  const openEdit = (r: FixedAsset) => {
    setEditingId(r.id);
    setForm({
      asset_number: r.asset_number,
      asset_name: r.asset_name,
      quantity: r.quantity,
      brand: r.brand,
      model_spec: r.model_spec,
      production_date: r.production_date,
      entry_date: r.entry_date,
      original_value: r.original_value ? String(r.original_value) : '',
      user_name: r.user_name,
      department: r.department,
      location: r.location,
      remarks: r.remarks,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_name.trim()) { alert('资产名称不能为空'); return; }
    setSaving(true);
    const payload = { ...form, quantity: form.quantity || 1, original_value: parseFloat(form.original_value) || 0 };
    const res = editingId
      ? await fetch(`/api/assets/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      if (editingId) {
        setEditingId(null);
        setShowForm(false);
      } else {
        setForm(p => ({ ...p, remarks: '' }));
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      }
      fetchRecords();
    } else { alert((await res.json()).error || '保存失败'); }
    setSaving(false);
  };

  const formatMoney = (v: number) => v ? `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-';
  const displayValue = (r: FixedAsset, key: keyof FixedAsset) => {
    if (key === 'original_value') return formatMoney(r.original_value);
    const v = r[key];
    return (v === '' || v === null || v === undefined) ? '-' : String(v);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-800">固定资产登记</h2>
        <button onClick={() => { if (showForm && !editingId) setShowForm(false); else { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true); } }} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">+ 新建资产</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <h3 className="font-semibold text-stone-800">{editingId ? '编辑资产' : '新建资产'}</h3>
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
          <div className="flex gap-2 items-center">
            <button type="submit" disabled={saving} className="bg-amber-700 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-800 disabled:opacity-50">{saving ? '保存中…' : '保存'}</button>
            {savedFlash && <span className="text-green-600 text-sm">已保存</span>}
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-1.5 rounded text-sm border border-stone-300 text-stone-600 hover:bg-stone-50">取消</button>
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
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(r)} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">编辑</button>
                      <button onClick={() => setDetailItem(r)} className="text-xs px-2 py-1 rounded bg-stone-50 text-stone-600 hover:bg-stone-100">详情</button>
                      {isAdmin && <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>}
                    </div>
                  </td>
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

      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">资产详情</h3>
              <button onClick={() => setDetailItem(null)} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">×</button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {ASSET_FIELDS.map(f => (
                <div key={f.key} className={f.key === 'remarks' ? 'col-span-2' : ''}>
                  <dt className="text-xs text-stone-500">{f.label}</dt>
                  <dd className="text-sm text-stone-800 mt-0.5 whitespace-pre-wrap">{displayValue(detailItem, f.key)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
