'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tool_name: '',
    category: '',
    quantity: 1,
    warehouse_location: '',
    responsible_person: '',
    purchase_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetch(`/api/tools/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          tool_name: data.tool_name || '',
          category: data.category || '',
          quantity: data.quantity || 1,
          warehouse_location: data.warehouse_location || '',
          responsible_person: data.responsible_person || '',
          purchase_date: data.purchase_date || '',
          remarks: data.remarks || '',
        });
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tool_name.trim()) {
      alert('工具名称不能为空');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/tools/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push(`/tools/${id}`);
    } else {
      const data = await res.json();
      alert(data.error || '更新失败');
    }
    setSaving(false);
  };

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="text-center py-12 text-stone-400">加载中…</div>;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/tools/${id}`} className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
        <h2 className="text-2xl font-bold text-stone-800">编辑工具</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">工具名称 <span className="text-red-500">*</span></label>
          <input required type="text" value={form.tool_name} onChange={e => updateField('tool_name', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">类别</label>
            <input type="text" value={form.category} onChange={e => updateField('category', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">数量</label>
            <input type="number" min={1} value={form.quantity} onChange={e => updateField('quantity', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">存放位置</label>
            <input type="text" value={form.warehouse_location} onChange={e => updateField('warehouse_location', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">责任人</label>
            <input type="text" value={form.responsible_person} onChange={e => updateField('responsible_person', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">购置日期</label>
          <input type="date" value={form.purchase_date} onChange={e => updateField('purchase_date', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">备注</label>
          <textarea value={form.remarks} onChange={e => updateField('remarks', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors">
            {saving ? '保存中…' : '保存'}
          </button>
          <Link href={`/tools/${id}`} className="px-4 py-2.5 rounded-lg text-sm border border-stone-300 text-stone-700 hover:bg-stone-50">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
