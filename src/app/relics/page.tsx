'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Relic {
  id: number;
  warehouse_number: string;
  shelf_number: string;
  excavation_info: string;
  artifact_name: string;
  material: string;
  status: string;
  other_info: string;
  remarks: string;
  updated_at: string;
}

export default function RelicsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <RelicsContent />
    </Suspense>
  );
}

function RelicsContent() {
  const searchParams = useSearchParams();
  const [relics, setRelics] = useState<Relic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);

  const fetchRelics = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await fetch(`/api/relics?${params}`);
    const data = await res.json();
    setRelics(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchRelics();
  }, [fetchRelics]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除文物"${name}"吗？此操作不可撤销。`)) return;
    const res = await fetch(`/api/relics/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchRelics();
    } else {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-stone-800">文物列表</h2>
        <Link href="/relics/new" className="inline-flex items-center justify-center gap-1 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors self-start">
          + 新建文物
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="搜索器物名、出土信息、库房号…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">全部状态</option>
          <option value="在库">在库</option>
          <option value="出库">出库</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap">器物名</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden sm:table-cell">库房号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">架号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">出土信息</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden sm:table-cell">材质</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600 whitespace-nowrap">状态</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : relics.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-stone-400">暂无文物记录，请先新建文物</td></tr>
              ) : (
                relics.map(relic => (
                  <tr key={relic.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/relics/${relic.id}`} className="font-medium text-stone-800 hover:text-amber-700">
                        {relic.artifact_name}
                      </Link>
                      {relic.remarks && <div className="text-xs text-stone-400 mt-0.5 truncate max-w-40">{relic.remarks}</div>}
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{relic.warehouse_number || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{relic.shelf_number || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">{relic.excavation_info || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{relic.material || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        relic.status === '在库' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>{relic.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/relics/${relic.id}`} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200">详情</Link>
                        <Link href={`/relics/${relic.id}/edit`} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200">编辑</Link>
                        <button onClick={() => handleDelete(relic.id, relic.artifact_name)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 text-sm">
            <span className="text-stone-500">共 {total} 件文物</span>
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
