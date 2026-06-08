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
  funding_source: string;
  reimbursement_status: string;
  handler: string;
  remarks: string;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; type: string; total: number }[];
}

export default function WorkLedgerPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <WorkLedgerContent />
    </Suspense>
  );
}

function WorkLedgerContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, balance: 0, categoryBreakdown: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // New record form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    type: '支出' as '收入' | '支出',
    category: '',
    amount: '',
    description: '',
    funding_source: '',
    reimbursement_status: '未报销',
    handler: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const expenseCategories = ['办公费', '设备购置', '耗材费', '差旅费', '劳务费', '维修费', '运输费', '其他支出'];
  const incomeCategories = ['项目经费', '所拨经费', '其他收入'];
  const currentCategories = form.type === '支出' ? expenseCategories : incomeCategories;

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('ledgerType', '工作');
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(page));
    params.set('limit', '20');

    const [txRes, statsRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch('/api/transactions/stats?ledgerType=工作'),
    ]);

    const txData = await txRes.json();
    const statsData = await statsRes.json();

    setTransactions(txData.data);
    setTotal(txData.total);
    setTotalPages(txData.totalPages);
    setStats(statsData);
    setLoading(false);
  }, [search, typeFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此记录吗？')) return;
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const toggleReimbursement = async (tx: Transaction) => {
    const newStatus = tx.reimbursement_status === '已报销' ? '未报销' : '已报销';
    await fetch(`/api/transactions/${tx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reimbursement_status: newStatus }),
    });
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { alert('金额必须大于0'); return; }
    setSaving(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), ledger_type: '工作' }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ transaction_date: new Date().toISOString().slice(0, 10), type: '支出', category: '', amount: '', description: '', funding_source: '', reimbursement_status: '未报销', handler: '', remarks: '' });
      fetchData();
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
        <h2 className="text-2xl font-bold text-stone-800">工作账本</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(!showStats)}
            className="px-3 py-2 rounded-lg text-sm border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors">
            {showStats ? '隐藏统计' : '查看统计'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-1 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors self-start">
            + 新建记录
          </button>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
              <div className="text-xs text-stone-500">总收入</div>
              <div className="text-xl font-bold text-green-700 mt-1">{formatAmount(stats.totalIncome)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
              <div className="text-xs text-stone-500">总支出</div>
              <div className="text-xl font-bold text-red-700 mt-1">{formatAmount(stats.totalExpense)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
              <div className="text-xs text-stone-500">结余</div>
              <div className={`text-xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatAmount(stats.balance)}
              </div>
            </div>
          </div>
          {stats.categoryBreakdown.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">支出分类</h3>
                <div className="space-y-1.5">
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
              <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">收入分类</h3>
                <div className="space-y-1.5">
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

      {/* New record form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">日期 <span className="text-red-500">*</span></label>
              <input required type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">类型</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as '收入' | '支出', category: '' }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="支出">支出</option>
                <option value="收入">收入</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">金额 <span className="text-red-500">*</span></label>
              <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">类别</label>
              <div className="flex flex-wrap gap-1">
                {currentCategories.map(c => (
                  <button type="button" key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                    className={`px-2 py-0.5 rounded text-xs border ${form.category === c ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">经费来源</label>
              <input type="text" value={form.funding_source} onChange={e => setForm(p => ({ ...p, funding_source: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如项目经费、所拨经费等" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">报销状态</label>
              <select value={form.reimbursement_status} onChange={e => setForm(p => ({ ...p, reimbursement_status: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="未报销">未报销</option>
                <option value="已报销">已报销</option>
              </select>
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
              className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
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
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" placeholder="搜索摘要、经办人…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
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
                <th className="text-left px-4 py-3 font-medium text-stone-600">日期</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">类型</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">类别</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">金额</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden lg:table-cell">经费来源</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">报销</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">摘要</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">加载中…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-400">暂无记录</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{tx.transaction_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === '收入' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{tx.type}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden sm:table-cell">{tx.category || '-'}</td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.type === '收入' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === '收入' ? '+' : '-'}{tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden lg:table-cell">{tx.funding_source || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleReimbursement(tx)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${tx.reimbursement_status === '已报销' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {tx.reimbursement_status || '未报销'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">
                      {tx.description || '-'}
                      {tx.handler && <span className="text-xs text-stone-400 ml-1">({tx.handler})</span>}
                    </td>
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
