'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Tool {
  id: number;
  tool_name: string;
  category: string;
  quantity: number;
  warehouse_location: string;
  status: string;
  responsible_person: string;
  remarks: string;
  updated_at: string;
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <ToolsContent />
    </Suspense>
  );
}

function ToolsContent() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await fetch(`/api/tools?${params}`);
    const data = await res.json();
    setTools(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除工具"${name}"吗？此操作不可撤销。`)) return;
    const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTools();
    } else {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-stone-800">工具列表</h2>
        <Link href="/tools/new" className="inline-flex items-center justify-center gap-1 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors self-start">
          + 新建工具
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="搜索工具名称、类别、存放位置…"
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

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap">工具名称</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden sm:table-cell">类别</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">数量</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">存放位置</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden sm:table-cell">责任人</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600 whitespace-nowrap">状态</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : tools.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-stone-400">暂无工具记录，请先新建工具</td></tr>
              ) : (
                tools.map(tool => (
                  <tr key={tool.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tools/${tool.id}`} className="font-medium text-stone-800 hover:text-amber-700">
                        {tool.tool_name}
                      </Link>
                      {tool.remarks && <div className="text-xs text-stone-400 mt-0.5 truncate max-w-40">{tool.remarks}</div>}
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{tool.category || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 text-center hidden md:table-cell">{tool.quantity}</td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">{tool.warehouse_location || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{tool.responsible_person || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        tool.status === '在库' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>{tool.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/tools/${tool.id}`} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200">详情</Link>
                        <Link href={`/tools/${tool.id}/edit`} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200">编辑</Link>
                        {isAdmin && <button onClick={() => handleDelete(tool.id, tool.tool_name)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 text-sm">
            <span className="text-stone-500">共 {total} 件工具</span>
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
