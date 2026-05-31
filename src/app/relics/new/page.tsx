'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewRelicPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    artifact_name: '',
    warehouse_number: '',
    shelf_number: '',
    excavation_info: '',
    material: '',
    other_info: '',
    remarks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.artifact_name.trim()) {
      alert('器物名不能为空');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/relics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/relics');
    } else {
      const data = await res.json();
      alert(data.error || '创建失败');
    }
    setSaving(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/relics" className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
        <h2 className="text-2xl font-bold text-stone-800">新建文物</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">器物名 <span className="text-red-500">*</span></label>
          <input required type="text" value={form.artifact_name} onChange={e => updateField('artifact_name', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="输入器物名称" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">库房号</label>
            <input type="text" value={form.warehouse_number} onChange={e => updateField('warehouse_number', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">架号</label>
            <input type="text" value={form.shelf_number} onChange={e => updateField('shelf_number', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">出土信息</label>
          <input type="text" value={form.excavation_info} onChange={e => updateField('excavation_info', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如遗址名、探方号、地层等" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">材质</label>
            <input type="text" value={form.material} onChange={e => updateField('material', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如陶、瓷、铜、玉等" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">其他</label>
            <input type="text" value={form.other_info} onChange={e => updateField('other_info', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
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
          <Link href="/relics" className="px-4 py-2.5 rounded-lg text-sm border border-stone-300 text-stone-700 hover:bg-stone-50">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
