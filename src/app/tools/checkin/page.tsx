'use client';

import { useState, useEffect, useCallback } from 'react';

interface CheckoutRecord {
  id: number;
  tool_id: number;
  checkout_time: string;
  checkout_person: string;
  purpose: string;
  checkout_quantity: number;
  tool_name: string;
  category: string;
  warehouse_location: string;
}

export default function ToolCheckinPage() {
  const [records, setRecords] = useState<(CheckoutRecord & { remaining: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<(CheckoutRecord & { remaining: number }) | null>(null);
  const [checkinPerson, setCheckinPerson] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [checkinQuantity, setCheckinQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchPendingCheckouts = useCallback(async () => {
    setLoading(true);

    const [coRes, ciRes] = await Promise.all([
      fetch('/api/tool-records?type=checkout&limit=500'),
      fetch('/api/tool-records?type=checkin&limit=500'),
    ]);

    const coData = await coRes.json();
    const ciData = await ciRes.json();

    const checkouts: CheckoutRecord[] = coData.data || [];
    const checkins: { checkout_record_id: number; checkin_quantity: number }[] = ciData.data || [];

    // Compute returned quantity per checkout record
    const returnedMap = new Map<number, number>();
    for (const ci of checkins) {
      const prev = returnedMap.get(ci.checkout_record_id) || 0;
      returnedMap.set(ci.checkout_record_id, prev + (ci.checkin_quantity || 1));
    }

    const pending = checkouts
      .map(co => {
        const returned = returnedMap.get(co.id) || 0;
        return { ...co, remaining: (co.checkout_quantity || 1) - returned };
      })
      .filter(co => co.remaining > 0);

    setRecords(pending);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPendingCheckouts(); }, [fetchPendingCheckouts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) { alert('请选择一条出库记录'); return; }
    if (!checkinPerson.trim()) { alert('经办人不能为空'); return; }
    if (checkinQuantity > selectedRecord.remaining) { alert(`归还数量不能超过待归还数量 ${selectedRecord.remaining}`); return; }
    setSubmitting(true);
    const res = await fetch(`/api/tools/${selectedRecord.tool_id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_record_id: selectedRecord.id,
        checkin_person: checkinPerson,
        condition_notes: conditionNotes,
        remarks: remarks,
        checkin_time: checkinTime || undefined,
        checkin_quantity: checkinQuantity,
      }),
    });
    if (res.ok) {
      setSuccess(true);
      setSelectedRecord(null);
      setCheckinPerson('');
      setConditionNotes('');
      setRemarks('');
      setCheckinTime('');
      setCheckinQuantity(1);
      fetchPendingCheckouts();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      alert(data.error || '入库失败');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">工具入库登记</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm">入库登记成功</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">选择出库记录 <span className="text-red-500">*</span></label>
          <div className="border border-stone-200 rounded-lg max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-stone-400 text-sm">加载中…</div>
            ) : records.length === 0 ? (
              <div className="px-4 py-6 text-center text-stone-400 text-sm">没有待入库的工具</div>
            ) : (
              records.map(rec => (
                <label key={rec.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-stone-50 text-sm border-b border-stone-100 last:border-0 ${selectedRecord?.id === rec.id ? 'bg-amber-50' : ''}`}>
                  <input type="radio" name="record" checked={selectedRecord?.id === rec.id} onChange={() => { setSelectedRecord(rec); setCheckinQuantity(Math.min(checkinQuantity, rec.remaining)); }} className="accent-amber-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 truncate">{rec.tool_name}</div>
                    <div className="text-xs text-stone-500">
                      {rec.checkout_person && `出库经办: ${rec.checkout_person} · `}
                      出库 {rec.checkout_quantity || 1} 件 · 待归还 {rec.remaining} 件
                      {rec.checkout_time && ` · ${new Date(rec.checkout_time).toLocaleString('zh-CN')}`}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">归还数量 <span className="text-red-500">*</span></label>
          <input required type="number" min="1" max={selectedRecord?.remaining || 1} value={checkinQuantity} onChange={e => setCheckinQuantity(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">经办人 <span className="text-red-500">*</span></label>
          <input required value={checkinPerson} onChange={e => setCheckinPerson(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="入库经办人姓名" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">归还状况</label>
          <input value={conditionNotes} onChange={e => setConditionNotes(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如完好、有损等" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">备注</label>
          <input value={remarks} onChange={e => setRemarks(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">入库时间</label>
          <input type="datetime-local" value={checkinTime} onChange={e => setCheckinTime(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <div className="text-xs text-stone-400 mt-1">留空则使用当前时间</div>
        </div>

        <button type="submit" disabled={submitting || !selectedRecord}
          className="w-full bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors">
          {submitting ? '处理中…' : '确认入库'}
        </button>
      </form>
    </div>
  );
}
