'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Relic {
  id: number;
  warehouse_number: string;
  shelf_number: string;
  artifact_name: string;
  material: string;
  excavation_info: string;
}

interface CheckoutRecord {
  id: number;
  relic_id: number;
  checkout_time: string;
  checkout_person: string;
  purpose: string;
}

export default function CheckinPage() {
  const [outRelics, setOutRelics] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkoutRecords, setCheckoutRecords] = useState<CheckoutRecord[]>([]);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<number | null>(null);
  const [checkinPerson, setCheckinPerson] = useState('');
  const [checkinCondition, setCheckinCondition] = useState('');
  const [checkinRemarks, setCheckinRemarks] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchOutRelics = async () => {
    const res = await fetch('/api/relics?status=出库&limit=100');
    const data = await res.json();
    setOutRelics(data.data || []);
  };

  useEffect(() => { fetchOutRelics(); }, []);

  const fetchUnreturnedCheckouts = async (relicId: number) => {
    const res = await fetch(`/api/relics/${relicId}`);
    const data = await res.json();
    const allCheckouts = data.checkoutRecords || [];
    const checkins = data.checkinRecords || [];
    const uncheckedout = allCheckouts.filter((cr: any) => !checkins.some((cir: any) => cir.checkout_record_id === cr.id));
    setCheckoutRecords(uncheckedout);
    if (uncheckedout.length > 0) {
      setSelectedCheckoutId(uncheckedout[0].id);
    }
  };

  const handleSelectRelic = (id: number) => {
    setSelectedId(id);
    setSelectedCheckoutId(null);
    fetchUnreturnedCheckouts(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { alert('请选择一件文物'); return; }
    if (!selectedCheckoutId) { alert('请选择出库记录'); return; }
    if (!checkinPerson.trim()) { alert('经办人不能为空'); return; }
    setSubmitting(true);
    const res = await fetch(`/api/relics/${selectedId}/checkin`, {
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
      setSuccess(true);
      setSelectedId(null);
      setCheckoutRecords([]);
      setSelectedCheckoutId(null);
      setCheckinPerson('');
      setCheckinCondition('');
      setCheckinRemarks('');
      setCheckinTime('');
      fetchOutRelics();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      alert(data.error || '入库失败');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">入库登记</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm">入库登记成功</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">选择出库中的文物 <span className="text-red-500">*</span></label>
          <div className="border border-stone-200 rounded-lg max-h-48 overflow-y-auto">
            {outRelics.length === 0 ? (
              <div className="px-4 py-6 text-center text-stone-400 text-sm">当前没有出库中的文物</div>
            ) : (
              outRelics.map((relic: any) => (
                <label key={relic.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-stone-50 text-sm border-b border-stone-100 last:border-0 ${selectedId === relic.id ? 'bg-green-50' : ''}`}>
                  <input type="radio" name="relic" checked={selectedId === relic.id} onChange={() => handleSelectRelic(relic.id)} className="accent-green-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 truncate">{relic.artifact_name}</div>
                    <div className="text-xs text-stone-500">{relic.warehouse_number && `库房 ${relic.warehouse_number}`} {relic.shelf_number && `架 ${relic.shelf_number}`} {relic.material && `· ${relic.material}`}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {selectedId && checkoutRecords.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">关联出库记录</label>
            <select value={selectedCheckoutId || ''} onChange={e => setSelectedCheckoutId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {checkoutRecords.map((cr: any) => (
                <option key={cr.id} value={cr.id}>
                  {new Date(cr.checkout_time).toLocaleString('zh-CN')} — {cr.checkout_person} {cr.purpose && `(${cr.purpose})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedId && checkoutRecords.length === 0 && (
          <div className="text-sm text-stone-500 bg-stone-50 rounded-lg px-4 py-3">该文物所有出库记录均已归还</div>
        )}

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
          <div className="text-xs text-stone-400 mt-1">留空则使用当前时间</div>
        </div>

        <button type="submit" disabled={submitting || !selectedId || checkoutRecords.length === 0}
          className="w-full bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
          {submitting ? '处理中…' : '确认入库'}
        </button>
      </form>
    </div>
  );
}
