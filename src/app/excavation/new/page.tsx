'use client';

import Link from 'next/link';
import FeatureForm from '../FeatureForm';

export default function NewFeaturePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/excavation" className="text-stone-500 hover:text-stone-700">&larr; 返回</Link>
        <h2 className="text-2xl font-bold text-stone-800">新建遗迹</h2>
      </div>
      <FeatureForm />
    </div>
  );
}
