'use client';

import { useState, useEffect, useCallback } from 'react';

interface CheckoutRecord {
  id: number;
  tool_id: number;
  checkout_time: string;
  checkout_person: string;
  purpose: string;
  tool_name: string;
  category: string;
  warehouse_location: string;
}

export default function ToolCheckinPage() {
  const [records, setRecords] = useState<CheckoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<CheckoutRecord | null>(null);
  const [checkinPerson, setCheckinPerson] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchOutTools = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tools?status=出库&limit=100');
    const data = await res.json();
    const outTools = data.data || [];

    // Get checkout records for each out-stock tool
    const recordsWithTool: CheckoutRecord[] = [];
    for (const tool of outTools) {
      const recRes = await fetch(`/api/tool-records?type=checkout&limit=50`);
      const recData = await recRes.json();
      const toolCheckouts = (recData.data || []).filter((r: any) => r.tool_id === tool.id);
      for (const cr of toolCheckouts) {
        // Check if already checked in
        const checkinRes = await fetch(`/api/tool-records?type=checkin&limit=50`);
        const checkinData = await checkinRes.json();
        const alreadyCheckedIn = (checkinData.data || []).some((ci: any) => ci.checkout_record_id === cr.id);
        if (!alreadyCheckedIn) {
          recordsWithTool.push({ ...cr, tool_name: tool.tool_name, category: tool.category, warehouse_location: tool.warehouse_location });
        }
      }
    }
    setRecords(recordsWithTool);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOutTools(); }, [fetchOutTools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) { alert('请选择一条出库记录'); return; }
    if (!checkinPerson.trim()) { alert('经办人不能为空'); return; }
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
      }),
    });
    if (res.ok) {
      setSuccess(true);
      setSelectedRecord(null);
      setCheckinPerson('');
      setConditionNotes('');
      setRemarks('');
      setCheckinTime('');
      fetchOutTools();
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
                  <input type="radio" name="record" checked={selectedRecord?.id === rec.id} onChange={() => setSelectedRecord(rec)} className="accent-amber-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 truncate">{rec.tool_name}</div>
                    <div className="text-xs text-stone-500">
                      {rec.checkout_person && `出库经办: ${rec.checkout_person} · `}
                      {rec.checkout_time && new Date(rec.checkout_time).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
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
