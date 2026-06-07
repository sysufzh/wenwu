'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Transaction {
  id: number;
  transaction_date: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  handler: string;
  remarks: string;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function LivingLedgerPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <LivingLedgerContent />
    </Suspense>
  );
}

function LivingLedgerContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // New record form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    type: '支出' as '收入' | '支出',
    category: '伙食费',
    amount: '',
    description: '',
    handler: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('ledgerType', '生活');
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(page));
    params.set('limit', '20');

    const [txRes, statsRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch('/api/transactions/stats?ledgerType=生活'),
    ]);

    const txData = await txRes.json();
    const statsData = await statsRes.json();

    setTransactions(txData.data);
    setTotal(txData.total);
    setTotalPages(txData.totalPages);
    setStats(statsData);
    setLoading(false);
  }, [dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此记录吗？')) return;
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { alert('金额必须大于0'); return; }
    setSaving(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), ledger_type: '生活' }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ transaction_date: new Date().toISOString().slice(0, 10), type: '支出', category: '伙食费', amount: '', description: '', handler: '', remarks: '' });
      fetchData();
      setTimeout(() => {}, 3000);
    } else {
      const data = await res.json();
      alert(data.error || '创建失败');
    }
    setSaving(false);
  };

  const formatAmount = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-stone-800">生活账本</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-1 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors self-start">
          + 新建记录
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
          <div className="text-xs text-stone-500">本月支出</div>
          <div className="text-xl font-bold text-red-700 mt-1">{formatAmount(stats.totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
          <div className="text-xs text-stone-500">本月收入</div>
          <div className="text-xl font-bold text-green-700 mt-1">{formatAmount(stats.totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
          <div className="text-xs text-stone-500">结余</div>
          <div className={`text-xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatAmount(stats.balance)}
          </div>
        </div>
      </div>

      {/* New record form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">日期</label>
              <input required type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">类型</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as '收入' | '支出' }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="支出">支出</option>
                <option value="收入">收入</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">金额</label>
              <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">经办人</label>
              <input type="text" value={form.handler} onChange={e => setForm(p => ({ ...p, handler: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">摘要</label>
            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如早餐、午餐食材等" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-amber-700 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-800 disabled:opacity-50 transition-colors">
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-1.5 rounded text-sm border border-stone-300 text-stone-600 hover:bg-stone-50">
              取消
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2">
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
                <th className="text-left px-4 py-3 font-medium text-stone-600">日期</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">类型</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">金额</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">摘要</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">经办人</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-400">暂无记录</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{tx.transaction_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === '收入' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{tx.type}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.type === '收入' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === '收入' ? '+' : '-'}{tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{tx.description || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{tx.handler || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && <button onClick={() => handleDelete(tx.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 text-sm">
            <span className="text-stone-500">共 {total} 条</span>
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
