'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || '');
  const [person, setPerson] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (person) params.set('person', person);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await fetch(`/api/records?${params}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [type, person, dateFrom, dateTo, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const records = type === 'checkout' ? data?.data : type === 'checkin' ? data?.data : null;
  const checkouts = !type ? data?.checkouts : null;
  const checkins = !type ? data?.checkins : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">出入库记录</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">全部类型</option>
            <option value="checkout">出库记录</option>
            <option value="checkin">入库记录</option>
          </select>
          <input type="text" placeholder="经办人" value={person} onChange={e => { setPerson(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 sm:w-32" />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <span className="text-stone-400 self-center">至</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
      </div>

      {/* Records list */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        {loading ? (
          <div className="px-4 py-12 text-center text-stone-400">加载中…</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {type === 'checkout' && (
              <>
                {(!records || records.length === 0) ? (
                  <div className="px-4 py-12 text-center text-stone-400 text-sm">暂无出库记录</div>
                ) : (
                  records.map((r: any) => (
                    <div key={r.id} className="px-5 py-3 hover:bg-stone-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/relics/${r.relic_id}`} className="font-medium text-stone-800 hover:text-amber-700">{r.artifact_name}</Link>
                          <div className="text-xs text-stone-500 mt-0.5">
                            库房 {r.warehouse_number || '-'} · 架 {r.shelf_number || '-'}
                          </div>
                        </div>
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">出库</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-stone-500">
                        <span>经办人: {r.checkout_person || '-'}</span>
                        <span>时间: {new Date(r.checkout_time).toLocaleString('zh-CN')}</span>
                        {r.purpose && <span>用途: {r.purpose}</span>}
                      </div>
                    </div>
                  ))
                )}
                {data?.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-sm rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">上一页</button>
                    <span className="text-sm text-stone-500">{page}/{data.totalPages}</span>
                    <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-sm rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">下一页</button>
                  </div>
                )}
              </>
            )}

            {type === 'checkin' && (
              <>
                {(!records || records.length === 0) ? (
                  <div className="px-4 py-12 text-center text-stone-400 text-sm">暂无入库记录</div>
                ) : (
                  records.map((r: any) => (
                    <div key={r.id} className="px-5 py-3 hover:bg-stone-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/relics/${r.relic_id}`} className="font-medium text-stone-800 hover:text-amber-700">{r.artifact_name}</Link>
                          <div className="text-xs text-stone-500 mt-0.5">
                            库房 {r.warehouse_number || '-'} · 架 {r.shelf_number || '-'}
                          </div>
                        </div>
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">入库</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-stone-500">
                        <span>经办人: {r.checkin_person || '-'}</span>
                        <span>时间: {new Date(r.checkin_time).toLocaleString('zh-CN')}</span>
                        {r.condition_notes && <span>状况: {r.condition_notes}</span>}
                        {r.checkout_person && <span>出库经办人: {r.checkout_person}</span>}
                      </div>
                    </div>
                  ))
                )}
                {data?.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-sm rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">上一页</button>
                    <span className="text-sm text-stone-500">{page}/{data.totalPages}</span>
                    <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-sm rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">下一页</button>
                  </div>
                )}
              </>
            )}

            {!type && (
              <>
                {(!checkouts || checkouts.length === 0) && (!checkins || checkins.length === 0) ? (
                  <div className="px-4 py-12 text-center text-stone-400 text-sm">暂无出入库记录</div>
                ) : (
                  <>
                    {checkouts?.map((r: any) => (
                      <div key={`co-${r.id}`} className="px-5 py-3 hover:bg-stone-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/relics/${r.relic_id}`} className="font-medium text-stone-800 hover:text-amber-700">{r.artifact_name}</Link>
                            <div className="text-xs text-stone-500 mt-0.5">库房 {r.warehouse_number || '-'}{r.shelf_number && ` · 架 ${r.shelf_number}`}</div>
                          </div>
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">出库</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-stone-500">
                          <span>经办人: {r.checkout_person || '-'}</span>
                          <span>{new Date(r.checkout_time).toLocaleString('zh-CN')}</span>
                          {r.purpose && <span>用途: {r.purpose}</span>}
                        </div>
                      </div>
                    ))}
                    {checkins?.map((r: any) => (
                      <div key={`ci-${r.id}`} className="px-5 py-3 hover:bg-stone-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/relics/${r.relic_id}`} className="font-medium text-stone-800 hover:text-amber-700">{r.artifact_name}</Link>
                            <div className="text-xs text-stone-500 mt-0.5">库房 {r.warehouse_number || '-'}{r.shelf_number && ` · 架 ${r.shelf_number}`}</div>
                          </div>
                          <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">入库</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-stone-500">
                          <span>经办人: {r.checkin_person || '-'}</span>
                          <span>{new Date(r.checkin_time).toLocaleString('zh-CN')}</span>
                          {r.condition_notes && <span>状况: {r.condition_notes}</span>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
