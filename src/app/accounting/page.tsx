'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Transaction {
  id: number;
  transaction_date: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  handler: string;
  remarks: string;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; type: string; total: number }[];
}

export default function AccountingPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <AccountingContent />
    </Suspense>
  );
}

function AccountingContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, balance: 0, categoryBreakdown: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(page));
    params.set('limit', '20');

    const [txRes, statsRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch('/api/transactions/stats'),
    ]);

    const txData = await txRes.json();
    const statsData = await statsRes.json();

    setTransactions(txData.data);
    setTotal(txData.total);
    setTotalPages(txData.totalPages);
    setStats(statsData);
    setLoading(false);
  }, [search, typeFilter, categoryFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: number, desc: string) => {
    if (!confirm(`确定要删除交易"${desc}"吗？`)) return;
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTransactions();
    } else {
      alert('删除失败');
    }
  };

  const formatAmount = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-stone-800">记账</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 rounded-lg text-sm border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors">
            {showStats ? '隐藏统计' : '查看统计'}
          </button>
          <Link href="/accounting/new" className="inline-flex items-center justify-center gap-1 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">
            + 新建记录
          </Link>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
              <div className="text-sm text-stone-500">总收入</div>
              <div className="text-2xl font-bold text-green-700 mt-1">{formatAmount(stats.totalIncome)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
              <div className="text-sm text-stone-500">总支出</div>
              <div className="text-2xl font-bold text-red-700 mt-1">{formatAmount(stats.totalExpense)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
              <div className="text-sm text-stone-500">结余</div>
              <div className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatAmount(stats.balance)}</div>
            </div>
          </div>

          {stats.categoryBreakdown.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">支出分类</h3>
                <div className="space-y-2">
                  {stats.categoryBreakdown.filter(c => c.type === '支出').map(c => (
                    <div key={`exp-${c.category}`} className="flex justify-between text-sm">
                      <span className="text-stone-600">{c.category || '未分类'}</span>
                      <span className="text-red-600 font-medium">{formatAmount(c.total)}</span>
                    </div>
                  ))}
                  {stats.categoryBreakdown.filter(c => c.type === '支出').length === 0 && (
                    <div className="text-stone-400 text-sm">暂无支出</div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">收入分类</h3>
                <div className="space-y-2">
                  {stats.categoryBreakdown.filter(c => c.type === '收入').map(c => (
                    <div key={`inc-${c.category}`} className="flex justify-between text-sm">
                      <span className="text-stone-600">{c.category || '未分类'}</span>
                      <span className="text-green-600 font-medium">{formatAmount(c.total)}</span>
                    </div>
                  ))}
                  {stats.categoryBreakdown.filter(c => c.type === '收入').length === 0 && (
                    <div className="text-stone-400 text-sm">暂无收入</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <input
          type="text" placeholder="搜索摘要、经办人…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[150px] px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">全部类型</option>
          <option value="收入">收入</option>
          <option value="支出">支出</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap">日期</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap">类型</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden sm:table-cell">类别</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600 whitespace-nowrap">金额</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 whitespace-nowrap hidden md:table-cell">摘要</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-400">暂无记账记录</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{tx.transaction_date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        tx.type === '收入' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>{tx.type}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{tx.category || '-'}</td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.type === '收入' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === '收入' ? '+' : '-'}{tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">
                      {tx.description || '-'}
                      {tx.handler && <span className="text-xs text-stone-400 ml-1">({tx.handler})</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && <button onClick={() => handleDelete(tx.id, tx.description || tx.transaction_date)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>}
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
