'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-stone-800 tracking-wide">中国社会科学院考古研究所</h1>
          <h2 className="text-xl text-stone-700 mt-1">东南工作队队务管理系统</h2>
        </div>

        {/* Backup message */}
        {backupMsg && (
          <div className={`text-sm px-4 py-2 rounded-lg mb-6 text-center ${backupMsg.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {backupMsg}
          </div>
        )}

        {/* Entry cards */}
        <div className="space-y-4">
          <Link
            href="/relics"
            className="flex items-center gap-5 bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div className="text-4xl">📦</div>
            <div>
              <div className="text-lg font-bold text-stone-800">文物库房台账</div>
              <div className="text-sm text-stone-500 mt-0.5">文物登记、出入库管理、记录查询</div>
            </div>
          </Link>

          <Link
            href="/tools"
            className="flex items-center gap-5 bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div className="text-4xl">🔧</div>
            <div>
              <div className="text-lg font-bold text-stone-800">工具管理系统</div>
              <div className="text-sm text-stone-500 mt-0.5">仓库工具登记、借用归还管理</div>
            </div>
          </Link>

          <Link
            href="/accounting"
            className="flex items-center gap-5 bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div className="text-4xl">💰</div>
            <div>
              <div className="text-lg font-bold text-stone-800">记账系统</div>
              <div className="text-sm text-stone-500 mt-0.5">收入支出记录、分类统计</div>
            </div>
          </Link>
        </div>

        {/* Admin backup button */}
        {isAdmin && (
          <div className="mt-8 text-center">
            <button
              onClick={handleBackup}
              className="text-xs px-4 py-2 rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors"
            >
              备份数据库
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
