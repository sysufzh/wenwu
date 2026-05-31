'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Relic {
  id: number;
  warehouse_number: string;
  shelf_number: string;
  artifact_name: string;
  material: string;
  status: string;
  excavation_info: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [relics, setRelics] = useState<Relic[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkoutPerson, setCheckoutPerson] = useState('');
  const [checkoutPurpose, setCheckoutPurpose] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchInStock = useCallback(async () => {
    const params = new URLSearchParams({ status: '在库', limit: '100' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/relics?${params}`);
    const data = await res.json();
    setRelics(data.data || []);
  }, [search]);

  useEffect(() => { fetchInStock(); }, [fetchInStock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { alert('请选择一件文物'); return; }
    if (!checkoutPerson.trim()) { alert('经办人不能为空'); return; }
    setSubmitting(true);
    const res = await fetch(`/api/relics/${selectedId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_person: checkoutPerson,
        purpose: checkoutPurpose,
        checkout_time: checkoutTime || undefined,
      }),
    });
    if (res.ok) {
      setSuccess(true);
      setSelectedId(null);
      setCheckoutPerson('');
      setCheckoutPurpose('');
      setCheckoutTime('');
      fetchInStock();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      alert(data.error || '出库失败');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">出库登记</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm">出库登记成功</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">选择文物 <span className="text-red-500">*</span></label>
          <input type="text" placeholder="搜索器物名以筛选…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <div className="border border-stone-200 rounded-lg max-h-48 overflow-y-auto">
            {relics.length === 0 ? (
              <div className="px-4 py-6 text-center text-stone-400 text-sm">暂无可出库的文物（均已在出库状态）</div>
            ) : (
              relics.map(relic => (
                <label key={relic.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-stone-50 text-sm border-b border-stone-100 last:border-0 ${selectedId === relic.id ? 'bg-amber-50' : ''}`}>
                  <input type="radio" name="relic" checked={selectedId === relic.id} onChange={() => setSelectedId(relic.id)} className="accent-amber-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 truncate">{relic.artifact_name}</div>
                    <div className="text-xs text-stone-500">{relic.warehouse_number && `库房 ${relic.warehouse_number}`} {relic.shelf_number && `架 ${relic.shelf_number}`} {relic.material && `· ${relic.material}`}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">经办人 <span className="text-red-500">*</span></label>
          <input required value={checkoutPerson} onChange={e => setCheckoutPerson(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="出库经办人姓名" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">出库用途</label>
          <input value={checkoutPurpose} onChange={e => setCheckoutPurpose(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如展览、研究、修复等" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">出库时间</label>
          <input type="datetime-local" value={checkoutTime} onChange={e => setCheckoutTime(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <div className="text-xs text-stone-400 mt-1">留空则使用当前时间</div>
        </div>

        <button type="submit" disabled={submitting || !selectedId}
          className="w-full bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors">
          {submitting ? '处理中…' : '确认出库'}
        </button>
      </form>
    </div>
  );
}
