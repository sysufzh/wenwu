'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Layer {
  id: number; layer_number: string; soil_color: string; soil_texture: string; density: string;
  thickness: string; deposit_shape: string; inclusions: string; preservation: string;
  cleaning_method: string; deposit_nature: string; depth_text: string; remarks: string;
}

interface Artifact {
  id: number; layer_number: string; type: string; quantity: string; number: string; remarks: string;
}

interface Feature {
  id: number; feature_number: string; trench_number: string; site_name: string; year: string; district: string;
  position: string; shape: string; opening_size: string; depth: string; bottom_size: string;
  drawing_info: string; photo_info: string; excavation_process: string; wall_bottom_detail: string;
  stratigraphy: string; dating: string; function_nature: string; sampling: string; remarks: string;
  recorder: string; record_date: string;
  layers: Layer[]; artifacts: Artifact[];
}

const DOC_TYPES = [
  { type: 'record', label: '发掘记录' },
  { type: 'record_table', label: '发掘记录表' },
  { type: 'feature_register', label: '遗迹登记表' },
  { type: 'deposit', label: '堆积记录表' },
];

export default function FeatureDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <FeatureDetail />
    </Suspense>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="py-1">
      <span className="text-stone-500 text-sm">{label}：</span>
      <span className="text-stone-800 text-sm whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function FeatureDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFeature = useCallback(async () => {
    const res = await fetch(`/api/excavation/${params.id}`);
    if (res.ok) setFeature(await res.json());
    else setFeature(null);
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchFeature(); }, [fetchFeature]);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const handleDelete = async () => {
    if (!confirm('确定要删除该遗迹吗？此操作不可撤销。')) return;
    const res = await fetch(`/api/excavation/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/excavation');
    else alert('删除失败');
  };

  if (loading) return <div className="text-center py-12 text-stone-400">加载中…</div>;
  if (!feature) return <div className="text-center py-12 text-stone-400">遗迹不存在</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/excavation" className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
          <h2 className="text-2xl font-bold text-stone-800">{feature.trench_number}{feature.feature_number}</h2>
        </div>
        <div className="flex gap-2">
          <Link href={`/excavation/${feature.id}/edit`} className="px-3 py-2 rounded-lg text-sm border border-stone-300 text-stone-600 hover:bg-stone-100">编辑</Link>
          {isAdmin && (
            <button onClick={handleDelete} className="px-3 py-2 rounded-lg text-sm border border-red-300 text-red-600 hover:bg-red-50">删除</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
        <h3 className="text-base font-bold text-stone-800 mb-2">生成 Word 文档</h3>
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map(d => (
            <a
              key={d.type}
              href={`/api/excavation/${feature.id}/doc?type=${d.type}`}
              className="px-4 py-2 rounded-lg text-sm bg-amber-700 text-white hover:bg-amber-800"
            >
              {d.label}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-1">
        <h3 className="text-base font-bold text-stone-800 border-b border-stone-100 pb-2 mb-2">基本信息</h3>
        <Field label="遗迹号" value={feature.feature_number} />
        <Field label="探方号" value={feature.trench_number} />
        <Field label="遗址名" value={feature.site_name} />
        <Field label="年度" value={feature.year} />
        <Field label="区位" value={feature.district} />
        <Field label="位置" value={feature.position} />
        <Field label="形状" value={feature.shape} />
        <Field label="口部尺寸" value={feature.opening_size} />
        <Field label="深度" value={feature.depth} />
        <Field label="底部尺寸" value={feature.bottom_size} />
        <Field label="绘图号与图名" value={feature.drawing_info} />
        <Field label="摄影" value={feature.photo_info} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-1">
        <h3 className="text-base font-bold text-stone-800 border-b border-stone-100 pb-2 mb-2">发掘记录内容</h3>
        <Field label="发掘经过" value={feature.excavation_process} />
        <Field label="坑壁与底的细节" value={feature.wall_bottom_detail} />
        <Field label="层位关系" value={feature.stratigraphy} />
        <Field label="年代推断" value={feature.dating} />
        <Field label="性质功能" value={feature.function_nature} />
        <Field label="采样" value={feature.sampling} />
        <Field label="备注" value={feature.remarks} />
        <Field label="记录者" value={feature.recorder} />
        <Field label="记录日期" value={feature.record_date} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
        <h3 className="text-base font-bold text-stone-800 border-b border-stone-100 pb-2 mb-2">堆积层（{feature.layers.length}）</h3>
        {feature.layers.length === 0 ? <p className="text-stone-400 text-sm">无</p> : (
          <div className="space-y-2">
            {feature.layers.map(l => (
              <div key={l.id} className="border border-stone-100 rounded-lg p-3 text-sm">
                <div className="font-medium text-stone-800">{l.layer_number || '—'}</div>
                <div className="text-stone-600 mt-1">
                  {[l.soil_color, l.soil_texture, l.density, l.thickness, l.deposit_shape].filter(Boolean).join(' / ')}
                </div>
                {l.inclusions && <div className="text-stone-600">含：{l.inclusions}</div>}
                {l.cleaning_method && <div className="text-stone-600">清理：{l.cleaning_method}</div>}
                {l.remarks && <div className="text-stone-500">备注：{l.remarks}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
        <h3 className="text-base font-bold text-stone-800 border-b border-stone-100 pb-2 mb-2">遗物（{feature.artifacts.length}）</h3>
        {feature.artifacts.length === 0 ? <p className="text-stone-400 text-sm">无</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-stone-600">所属层</th>
                  <th className="text-left px-3 py-2 font-medium text-stone-600">类型</th>
                  <th className="text-left px-3 py-2 font-medium text-stone-600">数量</th>
                  <th className="text-left px-3 py-2 font-medium text-stone-600">编号</th>
                  <th className="text-left px-3 py-2 font-medium text-stone-600">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {feature.artifacts.map(a => (
                  <tr key={a.id}>
                    <td className="px-3 py-2">{a.layer_number}</td>
                    <td className="px-3 py-2">{a.type}</td>
                    <td className="px-3 py-2">{a.quantity}</td>
                    <td className="px-3 py-2">{a.number}</td>
                    <td className="px-3 py-2">{a.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
