'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ToolHistoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <ToolHistoryContent />
    </Suspense>
  );
}

function ToolHistoryContent() {
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [person, setPerson] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [data, setData] = useState<any>({ checkouts: [], checkins: [], checkoutTotal: 0, checkinTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (person) params.set('person', person);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await fetch(`/api/tool-records?${params}`);
    const result = await res.json();
    setData(result);
    if (result.checkouts !== undefined) {
      setTotal(result.checkoutTotal + result.checkinTotal);
      setTotalPages(1);
    } else {
      setTotal(result.total);
      setTotalPages(result.totalPages);
    }
    setLoading(false);
  }, [typeFilter, person, dateFrom, dateTo, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const renderRecords = () => {
    if (typeFilter === '') {
      // Combined view
      const allRecords: any[] = [];
      (data.checkouts || []).forEach((r: any) => allRecords.push({ ...r, recordType: 'checkout' }));
      (data.checkins || []).forEach((r: any) => allRecords.push({ ...r, recordType: 'checkin' }));
      allRecords.sort((a, b) => {
        const aTime = a.recordType === 'checkout' ? a.checkout_time : a.checkin_time;
        const bTime = b.recordType === 'checkout' ? b.checkout_time : b.checkin_time;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      if (allRecords.length === 0) {
        return <div className="px-4 py-12 text-center text-stone-400 text-sm">暂无记录</div>;
      }

      return allRecords.slice(0, 20).map((r, i) => (
        <div key={`${r.recordType}-${r.id}-${i}`} className="px-5 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium text-stone-800">{r.tool_name}</span>
              {r.category && <span className="text-xs text-stone-500 ml-2">{r.category}</span>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.recordType === 'checkout' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
              {r.recordType === 'checkout' ? '出库' : '入库'}
            </span>
          </div>
          <div className="flex gap-3 mt-1.5 text-xs text-stone-500">
            <span>{r.recordType === 'checkout' ? `出库 ${r.checkout_quantity || 1} 件` : `归还 ${r.checkin_quantity || 1} 件`}</span>
            <span>经办人: {r.recordType === 'checkout' ? r.checkout_person : r.checkin_person || '-'}</span>
            <span>{r.recordType === 'checkout' ? (r.checkout_time ? new Date(r.checkout_time).toLocaleString('zh-CN') : '-') : (r.checkin_time ? new Date(r.checkin_time).toLocaleString('zh-CN') : '-')}</span>
          </div>
        </div>
      ));
    }

    const records = data.data || [];
    if (records.length === 0) {
      return <div className="px-4 py-12 text-center text-stone-400 text-sm">暂无记录</div>;
    }

    return records.map((r: any) => (
      <div key={`${typeFilter}-${r.id}`} className="px-5 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-medium text-stone-800">{r.tool_name}</span>
            {r.category && <span className="text-xs text-stone-500 ml-2">{r.category}</span>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeFilter === 'checkout' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            {typeFilter === 'checkout' ? '出库' : '入库'}
          </span>
        </div>
        <div className="flex gap-3 mt-1.5 text-xs text-stone-500">
          <span>{typeFilter === 'checkout' ? `出库 ${r.checkout_quantity || 1} 件` : `归还 ${r.checkin_quantity || 1} 件`}</span>
          <span>经办人: {typeFilter === 'checkout' ? r.checkout_person : r.checkin_person || '-'}</span>
          <span>{(typeFilter === 'checkout' ? r.checkout_time : r.checkin_time) ? new Date((typeFilter === 'checkout' ? r.checkout_time : r.checkin_time)).toLocaleString('zh-CN') : '-'}</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">工具出入库记录</h2>

      <div className="flex flex-col sm:flex-row gap-2">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">全部类型</option>
          <option value="checkout">出库</option>
          <option value="checkin">入库</option>
        </select>
        <input type="text" placeholder="经办人…" value={person} onChange={e => { setPerson(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {loading ? (
            <div className="px-4 py-12 text-center text-stone-400">加载中…</div>
          ) : renderRecords()}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 text-sm">
            <span className="text-stone-500">共 {total} 条记录</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">上一页</button>
              <span className="px-3 py-1 text-stone-600">第 {page}/{totalPages} 页</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
