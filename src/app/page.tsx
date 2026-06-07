'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  inStock: number;
  outStock: number;
}

interface ToolStats {
  total: number;
  inStock: number;
  outStock: number;
}

interface AccountingStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ total: 0, inStock: 0, outStock: 0 });
  const [toolStats, setToolStats] = useState<ToolStats>({ total: 0, inStock: 0, outStock: 0 });
  const [acctStats, setAcctStats] = useState<AccountingStats>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recent, setRecent] = useState<{ checkouts: any[]; checkins: any[] }>({ checkouts: [], checkins: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
    fetch('/api/stats').then(r => r.json()).then(setStats);
    fetch('/api/tools/stats').then(r => r.json()).then(setToolStats).catch(() => {});
    fetch('/api/transactions/stats').then(r => r.json()).then(setAcctStats).catch(() => {});
    fetch('/api/records?limit=5').then(r => r.json()).then(data => {
      setRecent({ checkouts: data.checkouts || [], checkins: data.checkins || [] });
    });
  }, []);

  const handleBackup = async () => {
    setBackupMsg('');
    const res = await fetch('/api/backup', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setBackupMsg(`备份成功: ${data.file}`);
    } else {
      setBackupMsg(`备份失败: ${data.error}`);
    }
    setTimeout(() => setBackupMsg(''), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">总览面板</h2>
        {isAdmin && (
          <button onClick={handleBackup} className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors">
            备份数据库
          </button>
        )}
      </div>
      {backupMsg && (
        <div className={`text-sm px-4 py-2 rounded-lg ${backupMsg.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{backupMsg}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">文物总数</div>
          <div className="text-3xl font-bold text-stone-800 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">在库数量</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{stats.inStock}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">出库数量</div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{stats.outStock}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/relics/new" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">+</div>
          <div className="text-sm font-medium text-stone-700">新建文物</div>
        </Link>
        <Link href="/checkout" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&uarr;</div>
          <div className="text-sm font-medium text-stone-700">出库登记</div>
        </Link>
        <Link href="/checkin" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&darr;</div>
          <div className="text-sm font-medium text-stone-700">入库登记</div>
        </Link>
        <Link href="/history" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&#128203;</div>
          <div className="text-sm font-medium text-stone-700">出入记录</div>
        </Link>
      </div>

      {/* 工具管理 */}
      <h3 className="text-lg font-bold text-stone-700 mt-2">工具管理</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">工具总数</div>
          <div className="text-3xl font-bold text-stone-800 mt-1">{toolStats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">在库工具</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{toolStats.inStock}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">出库工具</div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{toolStats.outStock}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/tools/new" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">+</div>
          <div className="text-sm font-medium text-stone-700">新建工具</div>
        </Link>
        <Link href="/tools/checkout" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&uarr;</div>
          <div className="text-sm font-medium text-stone-700">工具出库</div>
        </Link>
        <Link href="/tools/checkin" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&darr;</div>
          <div className="text-sm font-medium text-stone-700">工具入库</div>
        </Link>
        <Link href="/tools/history" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&#128203;</div>
          <div className="text-sm font-medium text-stone-700">工具记录</div>
        </Link>
      </div>

      {/* 记账 */}
      <h3 className="text-lg font-bold text-stone-700 mt-2">记账</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">总收入</div>
          <div className="text-3xl font-bold text-green-700 mt-1">&yen;{acctStats.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">总支出</div>
          <div className="text-3xl font-bold text-red-700 mt-1">&yen;{acctStats.totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-stone-200">
          <div className="text-sm text-stone-500">结余</div>
          <div className={`text-3xl font-bold mt-1 ${acctStats.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            &yen;{acctStats.balance.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/accounting/new" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">+</div>
          <div className="text-sm font-medium text-stone-700">新建记录</div>
        </Link>
        <Link href="/accounting" className="bg-white rounded-xl shadow-sm p-4 border border-stone-200 hover:border-amber-400 transition-colors text-center">
          <div className="text-2xl mb-1">&#128203;</div>
          <div className="text-sm font-medium text-stone-700">查看明细</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200">
          <div className="px-5 py-3 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-semibold text-stone-800">最近出库</h3>
            <Link href="/history?type=checkout" className="text-xs text-amber-700 hover:underline">查看全部</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {recent.checkouts.length === 0 ? (
              <div className="px-5 py-8 text-center text-stone-400 text-sm">暂无出库记录</div>
            ) : (
              recent.checkouts.slice(0, 5).map((r: any) => (
                <div key={`co-${r.id}`} className="px-5 py-3 hover:bg-stone-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/relics/${r.relic_id}`} className="font-medium text-stone-800 hover:text-amber-700">{r.artifact_name}</Link>
                      <div className="text-xs text-stone-500 mt-0.5">{r.warehouse_number && `库房 ${r.warehouse_number}`}</div>
                    </div>
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">出库</span>
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-stone-500">
                    <span>经办人: {r.checkout_person || '-'}</span>
                    <span>{r.checkout_time ? new Date(r.checkout_time).toLocaleString('zh-CN') : '-'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200">
          <div className="px-5 py-3 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-semibold text-stone-800">最近入库</h3>
            <Link href="/history?type=checkin" className="text-xs text-amber-700 hover:underline">查看全部</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {recent.checkins.length === 0 ? (
              <div className="px-5 py-8 text-center text-stone-400 text-sm">暂无入库记录</div>
            ) : (
              recent.checkins.slice(0, 5).map((r: any) => (
                <div key={`ci-${r.id}`} className="px-5 py-3 hover:bg-stone-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/relics/${r.relic_id}`} className="font-medium text-stone-800 hover:text-amber-700">{r.artifact_name}</Link>
                      <div className="text-xs text-stone-500 mt-0.5">{r.warehouse_number && `库房 ${r.warehouse_number}`}</div>
                    </div>
                    <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">入库</span>
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-stone-500">
                    <span>经办人: {r.checkin_person || '-'}</span>
                    <span>{r.checkin_time ? new Date(r.checkin_time).toLocaleString('zh-CN') : '-'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
