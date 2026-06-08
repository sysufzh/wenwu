'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface VehicleUsage {
  id: number;
  usage_date: string;
  usage_time: string;
  license_plate: string;
  user_name: string;
  purpose: string;
  remarks: string;
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <VehiclesContent />
    </Suspense>
  );
}

const emptyForm = {
  usage_date: new Date().toISOString().slice(0, 10),
  usage_time: '',
  license_plate: '',
  user_name: '',
  purpose: '',
  remarks: '',
};

function VehiclesContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<VehicleUsage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
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
    const res = await fetch(`/api/vehicles?${p}`);
    const data = await res.json();
    setRecords(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const handleEdit = (r: VehicleUsage) => {
    setEditingId(r.id);
    setForm({
      usage_date: r.usage_date,
      usage_time: r.usage_time,
      license_plate: r.license_plate,
      user_name: r.user_name,
      purpose: r.purpose,
      remarks: r.remarks,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.license_plate.trim()) { alert('车牌号不能为空'); return; }
    setSaving(true);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });

    if (res.ok) {
      handleCancel();
      fetchRecords();
    } else { alert((await res.json()).error || (editingId ? '更新失败' : '创建失败')); }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-800">田野用车使用登记</h2>
        <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">
          + 新建记录
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="text-sm font-medium text-stone-700 mb-1">{editingId ? '编辑记录' : '新建记录'}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">日期 <span className="text-red-500">*</span></label>
              <input required type="date" value={form.usage_date} onChange={e => setForm(p => ({ ...p, usage_date: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">时间</label>
              <input type="time" value={form.usage_time} onChange={e => setForm(p => ({ ...p, usage_time: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">车牌号 <span className="text-red-500">*</span></label>
              <input required value={form.license_plate} onChange={e => setForm(p => ({ ...p, license_plate: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如京A12345" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">使用人</label>
              <input value={form.user_name} onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">使用事项</label>
              <input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如田野调查" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">备注</label>
              <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-amber-700 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-800 disabled:opacity-50">{saving ? '保存中…' : (editingId ? '确认修改' : '保存')}</button>
            <button type="button" onClick={handleCancel} className="px-4 py-1.5 rounded text-sm border border-stone-300 text-stone-600 hover:bg-stone-50">取消</button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <input type="text" placeholder="搜索车牌号、使用人、事项…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">日期</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">时间</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">车牌号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">使用人</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">事项</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-400">暂无记录</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{r.usage_date}</td>
                  <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{r.usage_time || '-'}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{r.license_plate}</td>
                  <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{r.user_name || '-'}</td>
                  <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">{r.purpose || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(r)} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200">编辑</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>
                      </div>
                    )}
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
    </div>
  );
}
