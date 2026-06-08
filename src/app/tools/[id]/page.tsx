'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Tool {
  id: number;
  tool_name: string;
  category: string;
  unit: string;
  quantity: number;
  warehouse_location: string;
  status: string;
  responsible_person: string;
  purchase_date: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export default function ToolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tools/${id}`)
      .then(r => r.json())
      .then(data => {
        setTool(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-12 text-stone-400">加载中…</div>;
  if (!tool) return <div className="text-center py-12 text-stone-400">工具不存在</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tools" className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
          <h2 className="text-2xl font-bold text-stone-800">{tool.tool_name}</h2>
        </div>
        <Link href={`/tools/${tool.id}/edit`} className="px-3 py-1.5 rounded-lg text-sm bg-stone-100 text-stone-700 hover:bg-stone-200">编辑</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-stone-500">类别</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.category || '-'}</dd>
          </div>
          <div>
            <dt className="text-stone-500">数量</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.quantity}</dd>
          </div>
          <div>
            <dt className="text-stone-500">单位</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.unit || '件'}</dd>
          </div>
          <div>
            <dt className="text-stone-500">存放位置</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.warehouse_location || '-'}</dd>
          </div>
          <div>
            <dt className="text-stone-500">状态</dt>
            <dd className="mt-0.5">
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                tool.status === '在库' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>{tool.status}</span>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">责任人</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.responsible_person || '-'}</dd>
          </div>
          <div>
            <dt className="text-stone-500">购置日期</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.purchase_date || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">备注</dt>
            <dd className="font-medium text-stone-800 mt-0.5">{tool.remarks || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">创建/更新时间</dt>
            <dd className="text-stone-600 mt-0.5 text-xs">
              创建: {tool.created_at ? new Date(tool.created_at).toLocaleString('zh-CN') : '-'}
              &nbsp;|&nbsp;
              更新: {tool.updated_at ? new Date(tool.updated_at).toLocaleString('zh-CN') : '-'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
