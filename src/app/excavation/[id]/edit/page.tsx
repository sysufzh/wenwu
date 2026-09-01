'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FeatureForm from '../../FeatureForm';

export default function EditFeaturePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <EditFeature />
    </Suspense>
  );
}

function EditFeature() {
  const params = useParams<{ id: string }>();
  const [feature, setFeature] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/excavation/${params.id}`).then(r => r.json()).then(data => {
      setFeature(data);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <div className="text-center py-12 text-stone-400">加载中…</div>;
  if (!feature || !feature.id) return <div className="text-center py-12 text-stone-400">遗迹不存在</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/excavation/${feature.id}`} className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
        <h2 className="text-2xl font-bold text-stone-800">编辑遗迹 {feature.feature_number}</h2>
      </div>
      <FeatureForm initial={feature} id={feature.id} />
    </div>
  );
}
