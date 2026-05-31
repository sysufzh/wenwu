'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RelicHistory {
  relic: Record<string, any>;
  checkoutRecords: any[];
  checkinRecords: any[];
}

interface RelicFull {
  id: number;
  warehouse_number: string;
  shelf_number: string;
  excavation_info: string;
  artifact_name: string;
  material: string;
  status: string;
  other_info: string;
  photo_path: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export default function RelicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [history, setHistory] = useState<RelicHistory | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkoutPerson, setCheckoutPerson] = useState('');
  const [checkoutPurpose, setCheckoutPurpose] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [checkinPerson, setCheckinPerson] = useState('');
  const [checkinCondition, setCheckinCondition] = useState('');
  const [checkinRemarks, setCheckinRemarks] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    const res = await fetch(`/api/relics/${id}`);
    if (res.status === 404) {
      router.push('/relics');
      return;
    }
    const data = await res.json();
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [id]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPerson.trim()) { alert('经办人不能为空'); return; }
    setSubmitting(true);
    const res = await fetch(`/api/relics/${id}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_person: checkoutPerson,
        purpose: checkoutPurpose,
        checkout_time: checkoutTime || undefined,
      }),
    });
    if (res.ok) {
      setShowCheckout(false);
      setCheckoutPerson(''); setCheckoutPurpose(''); setCheckoutTime('');
      fetchHistory();
    } else {
      const data = await res.json();
      alert(data.error || '出库失败');
    }
    setSubmitting(false);
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinPerson.trim()) { alert('经办人不能为空'); return; }
    if (!selectedCheckoutId) { alert('请选择关联的出库记录'); return; }
    setSubmitting(true);
    const res = await fetch(`/api/relics/${id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_record_id: selectedCheckoutId,
        checkin_person: checkinPerson,
        condition_notes: checkinCondition,
        remarks: checkinRemarks,
        checkin_time: checkinTime || undefined,
      }),
    });
    if (res.ok) {
      setShowCheckin(false);
      setCheckinPerson(''); setCheckinCondition(''); setCheckinRemarks(''); setCheckinTime('');
      setSelectedCheckoutId(null);
      fetchHistory();
    } else {
      const data = await res.json();
      alert(data.error || '入库失败');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-12 text-stone-400">加载中…</div>;
  if (!history) return null;

  const { relic, checkoutRecords, checkinRecords } = history;
  const uncheckedoutRecords = checkoutRecords.filter((cr: any) => {
    return !checkinRecords.some((cir: any) => cir.checkout_record_id === cr.id);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/relics" className="text-stone-500 hover:text-stone-700">&larr; 返回列表</Link>
        <h2 className="text-2xl font-bold text-stone-800">{relic.artifact_name}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          relic.status === '在库' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        }`}>{relic.status}</span>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-stone-500">库房号：</span><span className="text-stone-800">{relic.warehouse_number || '-'}</span></div>
          <div><span className="text-stone-500">架号：</span><span className="text-stone-800">{relic.shelf_number || '-'}</span></div>
          <div className="sm:col-span-2"><span className="text-stone-500">出土信息：</span><span className="text-stone-800">{relic.excavation_info || '-'}</span></div>
          <div><span className="text-stone-500">材质：</span><span className="text-stone-800">{relic.material || '-'}</span></div>
          <div><span className="text-stone-500">其他：</span><span className="text-stone-800">{relic.other_info || '-'}</span></div>
          <div className="sm:col-span-2"><span className="text-stone-500">备注：</span><span className="text-stone-800">{relic.remarks || '-'}</span></div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
          <Link href={`/relics/${id}/edit`} className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50">编辑信息</Link>
          {relic.status === '在库' && (
            <button onClick={() => setShowCheckout(true)} className="text-sm px-3 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800">出库登记</button>
          )}
          {relic.status === '出库' && uncheckedoutRecords.length > 0 && (
            <button onClick={() => { setShowCheckin(true); setSelectedCheckoutId(uncheckedoutRecords[0].id); }} className="text-sm px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800">入库登记</button>
          )}
        </div>
      </div>

      {/* Checkout dialog */}
      {showCheckout && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <h3 className="font-semibold text-stone-800 mb-4">出库登记 — {relic.artifact_name}</h3>
          <form onSubmit={handleCheckout} className="space-y-3">
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
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 disabled:opacity-50">确认出库</button>
              <button type="button" onClick={() => setShowCheckout(false)} className="px-4 py-2 rounded-lg text-sm border border-stone-300 text-stone-700 hover:bg-stone-50">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* Checkin dialog */}
      {showCheckin && (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
          <h3 className="font-semibold text-stone-800 mb-4">入库登记 — {relic.artifact_name}</h3>
          <form onSubmit={handleCheckin} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">关联出库记录</label>
              <select value={selectedCheckoutId || ''} onChange={e => setSelectedCheckoutId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {uncheckedoutRecords.map((cr: any) => (
                  <option key={cr.id} value={cr.id}>
                    {new Date(cr.checkout_time).toLocaleString('zh-CN')} — {cr.checkout_person} {cr.purpose && `(${cr.purpose})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">经办人 <span className="text-red-500">*</span></label>
              <input required value={checkinPerson} onChange={e => setCheckinPerson(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="入库经办人姓名" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">入库时状况</label>
              <input value={checkinCondition} onChange={e => setCheckinCondition(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="文物完好/有损/…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">备注</label>
              <input value={checkinRemarks} onChange={e => setCheckinRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">入库时间</label>
              <input type="datetime-local" value={checkinTime} onChange={e => setCheckinTime(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">确认入库</button>
              <button type="button" onClick={() => setShowCheckin(false)} className="px-4 py-2 rounded-lg text-sm border border-stone-300 text-stone-700 hover:bg-stone-50">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* History timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h3 className="font-semibold text-stone-800 mb-4">出入库历史</h3>
        {checkoutRecords.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-sm">暂无出入库记录</div>
        ) : (
          <div className="space-y-3">
            {checkoutRecords.map((cr: any) => {
              const relatedCheckin = checkinRecords.find((cir: any) => cir.checkout_record_id === cr.id);
              return (
                <div key={cr.id} className="border-l-2 border-stone-200 pl-4 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">出库</span>
                    <span className="text-sm text-stone-700 font-medium">{cr.checkout_person}</span>
                    <span className="text-xs text-stone-400">{new Date(cr.checkout_time).toLocaleString('zh-CN')}</span>
                  </div>
                  {cr.purpose && <div className="text-xs text-stone-500 mt-1">用途: {cr.purpose}</div>}
                  {relatedCheckin ? (
                    <div className="mt-2 ml-2 border-l-2 border-green-200 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">入库</span>
                        <span className="text-sm text-stone-700 font-medium">{relatedCheckin.checkin_person}</span>
                        <span className="text-xs text-stone-400">{new Date(relatedCheckin.checkin_time).toLocaleString('zh-CN')}</span>
                      </div>
                      {relatedCheckin.condition_notes && <div className="text-xs text-stone-500 mt-1">状况: {relatedCheckin.condition_notes}</div>}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 mt-1">尚未入库</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
