'use client';

import Link from 'next/link';

export default function AccountingPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-stone-800">记账系统</h2>
        <p className="text-sm text-stone-500 mt-1">请选择账本</p>
      </div>

      <div className="space-y-4">
        <Link
          href="/accounting/living"
          className="flex items-center gap-5 bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:border-amber-400 hover:shadow-md transition-all"
        >
          <div className="text-4xl">🍚</div>
          <div>
            <div className="text-lg font-bold text-stone-800">生活账本</div>
            <div className="text-sm text-stone-500 mt-0.5">记录每日伙食等生活支出</div>
          </div>
        </Link>

        <Link
          href="/accounting/work"
          className="flex items-center gap-5 bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:border-amber-400 hover:shadow-md transition-all"
        >
          <div className="text-4xl">💼</div>
          <div>
            <div className="text-lg font-bold text-stone-800">工作账本</div>
            <div className="text-sm text-stone-500 mt-0.5">记录工作相关收支，按经费来源分类</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
