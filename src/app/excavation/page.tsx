'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Feature {
  id: number;
  feature_number: string;
  trench_number: string;
  position: string;
  shape: string;
  dating: string;
  recorder: string;
  record_date: string;
  updated_at: string;
}

export default function ExcavationPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <ExcavationContent />
    </Suspense>
  );
}

function ExcavationContent() {
  const searchParams = useSearchParams();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '20');
    const res = await fetch(`/api/excavation?${params}`);
    const data = await res.json();
    setFeatures(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除遗迹"${name}"吗？此操作不可撤销。`)) return;
    const res = await fetch(`/api/excavation/${id}`, { method: 'DELETE' });
    if (res.ok) fetchFeatures();
    else alert('删除失败');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-stone-800">遗迹列表</h2>
        <Link href="/excavation/new" className="inline-flex items-center justify-center gap-1 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors self-start">
          + 新建遗迹
        </Link>
      </div>

      <input
        type="text"
        placeholder="搜索遗迹号、探方号、位置、记录者…"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap">遗迹号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap">探方号</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">位置</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden sm:table-cell">年代</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">记录者</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400">加载中…</td></tr>
              ) : features.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400">暂无遗迹记录</td></tr>
              ) : features.map(f => (
                <tr key={f.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">
                    <Link href={`/excavation/${f.id}`} className="hover:text-amber-700">{f.feature_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{f.trench_number}</td>
                  <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{f.position}</td>
                  <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{f.dating}</td>
                  <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{f.recorder}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/excavation/${f.id}`} className="text-amber-700 hover:text-amber-800 mr-3">查看</Link>
                    <Link href={`/excavation/${f.id}/edit`} className="text-stone-500 hover:text-stone-700 mr-3">编辑</Link>
                    {isAdmin && (
                      <button onClick={() => handleDelete(f.id, f.feature_number)} className="text-red-500 hover:text-red-700">删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between text-sm text-stone-500">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-40">上一页</button>
            <span className="py-1">{page} / {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-40">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
