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
  byFundingSource: { funding_source: string; totalIncome: number; totalExpense: number; categories: { category: string; type: string; total: number }[] }[];
}

interface FieldValues {
  fundingSources: string[];
  handlers: string[];
  categories: string[];
  lastFundingSource: string;
  lastHandler: string;
}

const LS_KEY = 'work_form_last';

function loadLastForm() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveLastForm(form: Record<string, unknown>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      transaction_date: form.transaction_date,
      category: form.category,
      funding_source: form.funding_source,
      handler: form.handler,
      description: form.description,
    }));
  } catch { /* ignore */ }
}

const emptyForm = {
  transaction_date: new Date().toISOString().slice(0, 10),
  type: '支出' as '收入' | '支出',
  category: '',
  amount: '',
  description: '',
  funding_source: '',
  reimbursement_status: '未报销',
  handler: '',
  remarks: '',
};

const SORT_FIELDS = [
  { key: 'transaction_date', label: '日期' },
  { key: 'type', label: '类型' },
  { key: 'category', label: '类别' },
  { key: 'amount', label: '金额' },
  { key: 'funding_source', label: '经费来源' },
  { key: 'reimbursement_status', label: '报销' },
];

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
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, balance: 0, categoryBreakdown: [], byFundingSource: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fundingSourceFilter, setFundingSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [fieldValues, setFieldValues] = useState<FieldValues>({ fundingSources: [], handlers: [], categories: [], lastFundingSource: '', lastHandler: '' });

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const expenseCategories = ['办公费', '设备购置', '耗材费', '差旅费', '劳务费', '维修费', '运输费', '其他支出'];
  const incomeCategories = ['项目经费', '所拨经费', '其他收入'];
  const defaultCategories = form.type === '支出' ? expenseCategories : incomeCategories;
  const allCategories = Array.from(new Set([...defaultCategories, ...fieldValues.categories]));

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
    fetch('/api/transactions/field-values?ledgerType=工作')
      .then(r => r.json())
      .then(data => setFieldValues(data));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('ledgerType', '工作');
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (fundingSourceFilter) params.set('fundingSource', fundingSourceFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sortField) params.set('sortField', sortField);
    if (sortOrder) params.set('sortOrder', sortOrder);
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
  }, [search, typeFilter, categoryFilter, fundingSourceFilter, dateFrom, dateTo, page, sortField, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此记录吗？')) return;
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); refetchFieldValues(); }
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

  const refetchFieldValues = () => {
    fetch('/api/transactions/field-values?ledgerType=工作')
      .then(r => r.json())
      .then(data => setFieldValues(data));
  };

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setForm({
      transaction_date: tx.transaction_date,
      type: tx.type as '收入' | '支出',
      category: tx.category,
      amount: String(tx.amount),
      description: tx.description,
      funding_source: tx.funding_source,
      reimbursement_status: tx.reimbursement_status || '未报销',
      handler: tx.handler,
      remarks: tx.remarks,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    const last = loadLastForm();
    setForm({
      ...emptyForm,
      transaction_date: new Date().toISOString().slice(0, 10),
      ...last,
      funding_source: last.funding_source || fieldValues.lastFundingSource || '',
      handler: last.handler || fieldValues.lastHandler || '',
    });
  };

  const handleNewForm = () => {
    setEditingId(null);
    const last = loadLastForm();
    setForm({
      ...emptyForm,
      transaction_date: new Date().toISOString().slice(0, 10),
      ...last,
      funding_source: last.funding_source || fieldValues.lastFundingSource || '',
      handler: last.handler || fieldValues.lastHandler || '',
    });
    setShowForm(!showForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { alert('金额必须大于0'); return; }
    setSaving(true);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
    const body = { ...form, amount: parseFloat(form.amount), ledger_type: '工作' };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (res.ok) {
      saveLastForm(form);
      handleCancel();
      fetchData();
      refetchFieldValues();
    } else {
      const data = await res.json();
      alert(data.error || (editingId ? '更新失败' : '创建失败'));
    }
    setSaving(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortArrow = (field: string) => {
    if (sortField !== field) return <span className="text-stone-300 ml-0.5">⇅</span>;
    return sortOrder === 'asc' ? <span className="text-amber-700 ml-0.5">↑</span> : <span className="text-amber-700 ml-0.5">↓</span>;
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
          <button onClick={handleNewForm}
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
                <h3 className="text-sm font-semibold text-stone-700 mb-2">支出分类（全部）</h3>
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
                <h3 className="text-sm font-semibold text-stone-700 mb-2">收入分类（全部）</h3>
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

          {stats.byFundingSource.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-3">按经费来源</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.byFundingSource.map(src => (
                  <div key={src.funding_source} className="bg-white rounded-xl shadow-sm p-4 border border-stone-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-semibold text-amber-800">{src.funding_source}</h4>
                      <div className="text-xs text-stone-500">
                        {src.totalIncome > 0 && <span className="text-green-600 mr-2">收 {formatAmount(src.totalIncome)}</span>}
                        <span className="text-red-600">支 {formatAmount(src.totalExpense)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {src.categories.filter(c => c.type === '支出').map(c => (
                        <div key={`${src.funding_source}-${c.category}`} className="flex justify-between text-sm">
                          <span className="text-stone-600">{c.category || '未分类'}</span>
                          <span className="text-red-600 font-medium">{formatAmount(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="text-sm font-medium text-stone-700 mb-1">{editingId ? '编辑记录' : '新建记录'}</div>
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
              <div className="flex flex-wrap gap-1 mb-1">
                {allCategories.map(c => (
                  <button type="button" key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                    className={`px-2 py-0.5 rounded text-xs border ${form.category === c ? 'bg-amber-700 text-white border-amber-700' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>{c}</button>
                ))}
              </div>
              <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="或手动输入新类别" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">经费来源</label>
              <input type="text" value={form.funding_source} onChange={e => setForm(p => ({ ...p, funding_source: e.target.value }))}
                list="funding-options"
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="如项目经费、所拨经费等" />
              <datalist id="funding-options">
                {fieldValues.fundingSources.map(s => <option key={s} value={s} />)}
              </datalist>
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
                list="handler-options"
                className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <datalist id="handler-options">
                {fieldValues.handlers.map(s => <option key={s} value={s} />)}
              </datalist>
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
              {saving ? '保存中…' : (editingId ? '确认修改' : '保存')}
            </button>
            <button type="button" onClick={handleCancel}
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
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-32">
          <option value="">全部类别</option>
          {fieldValues.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fundingSourceFilter} onChange={e => { setFundingSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-32">
          <option value="">全部来源</option>
          {fieldValues.fundingSources.map(s => <option key={s} value={s}>{s}</option>)}
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
                <th onClick={() => handleSort('transaction_date')} className="text-left px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:bg-stone-100 transition-colors">
                  日期{sortArrow('transaction_date')}
                </th>
                <th onClick={() => handleSort('type')} className="text-left px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:bg-stone-100 transition-colors">
                  类型{sortArrow('type')}
                </th>
                <th onClick={() => handleSort('category')} className="text-left px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:bg-stone-100 transition-colors hidden sm:table-cell">
                  类别{sortArrow('category')}
                </th>
                <th onClick={() => handleSort('amount')} className="text-right px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:bg-stone-100 transition-colors">
                  金额{sortArrow('amount')}
                </th>
                <th onClick={() => handleSort('funding_source')} className="text-left px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:bg-stone-100 transition-colors hidden lg:table-cell">
                  经费来源{sortArrow('funding_source')}
                </th>
                <th onClick={() => handleSort('reimbursement_status')} className="text-center px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:bg-stone-100 transition-colors">
                  报销{sortArrow('reimbursement_status')}
                </th>
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
                      {isAdmin ? (
                        <button onClick={() => toggleReimbursement(tx)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${tx.reimbursement_status === '已报销' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {tx.reimbursement_status || '未报销'}
                        </button>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.reimbursement_status === '已报销' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {tx.reimbursement_status || '未报销'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600 hidden md:table-cell max-w-40 truncate">
                      {tx.description || '-'}
                      {tx.handler && <span className="text-xs text-stone-400 ml-1">({tx.handler})</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(tx)} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200">编辑</button>
                          <button onClick={() => handleDelete(tx.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">删除</button>
                        </div>
                      )}
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
