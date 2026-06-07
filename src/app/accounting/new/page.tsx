'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  type: string;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    type: '支出' as '收入' | '支出',
    category: '',
    amount: '',
    description: '',
    payment_method: '',
    handler: '',
    remarks: '',
  });

  useEffect(() => {
    fetch('/api/transaction-categories')
      .then(r => r.json())
      .then(setCategories);
  }, []);

  const filteredCategories = categories.filter(c => c.type === form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.transaction_date) { alert('日期不能为空'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { alert('金额必须大于0'); return; }
    setSaving(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      router.push('/accounting');
    } else {
      const data = await res.json();
      alert(data.error || '创建失败');
    }
    setSaving(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      if (field === 'type') {
        newForm.category = '';
      }
      return newForm;
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/accounting" className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
        <h2 className="text-2xl font-bold text-stone-800">新建记录</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">日期 <span className="text-red-500">*</span></label>
            <input required type="date" value={form.transaction_date} onChange={e => updateField('transaction_date', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">类型 <span className="text-red-500">*</span></label>
            <select value={form.type} onChange={e => updateField('type', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="支出">支出</option>
              <option value="收入">收入</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">类别</label>
          {filteredCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map(c => (
                <button type="button" key={c.id}
                  onClick={() => updateField('category', c.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    form.category === c.name
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}>
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
          <input type="text" value={form.category} onChange={e => updateField('category', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mt-2" placeholder="或手动输入类别" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">金额 <span className="text-red-500">*</span></label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={e => updateField('amount', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">支付方式</label>
            <select value={form.payment_method} onChange={e => updateField('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">请选择</option>
              <option value="现金">现金</option>
              <option value="转账">转账</option>
              <option value="微信">微信</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">摘要</label>
          <input type="text" value={form.description} onChange={e => updateField('description', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="简要说明" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">经办人</label>
          <input type="text" value={form.handler} onChange={e => updateField('handler', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="经手人姓名" />
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
          <Link href="/accounting" className="px-4 py-2.5 rounded-lg text-sm border border-stone-300 text-stone-700 hover:bg-stone-50">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
