'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LayerInput {
  layer_number: string; soil_color: string; soil_texture: string; density: string;
  thickness: string; deposit_shape: string; inclusions: string; preservation: string;
  cleaning_method: string; deposit_nature: string; depth_text: string; remarks: string;
}

interface ArtifactInput {
  layer_number: string; type: string; quantity: string; number: string; remarks: string;
}

interface FeatureFormValues {
  feature_number: string; feature_type: string; trench_number: string; site_name: string; year: string; district: string;
  position: string; shape: string; opening_size: string; depth: string; bottom_size: string;
  drawing_info: string; photo_info: string; excavation_process: string; wall_bottom_detail: string;
  stratigraphy: string; dating: string; function_nature: string; sampling: string; remarks: string;
  recorder: string; record_date: string;
}

const emptyLayer = (): LayerInput => ({
  layer_number: '', soil_color: '', soil_texture: '', density: '', thickness: '',
  deposit_shape: '', inclusions: '', preservation: '', cleaning_method: '', deposit_nature: '',
  depth_text: '', remarks: '',
});

const emptyArtifact = (): ArtifactInput => ({
  layer_number: '', type: '', quantity: '', number: '', remarks: '',
});

const defaultValues: FeatureFormValues = {
  feature_number: '', feature_type: '', trench_number: '', site_name: '牛头山遗址', year: '2025', district: '',
  position: '', shape: '', opening_size: '', depth: '', bottom_size: '',
  drawing_info: '', photo_info: '', excavation_process: '', wall_bottom_detail: '',
  stratigraphy: '', dating: '', function_nature: '', sampling: '', remarks: '',
  recorder: '', record_date: new Date().toISOString().slice(0, 10),
};

const inputCls = 'w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500';
const labelCls = 'block text-sm font-medium text-stone-700 mb-1';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
      <h3 className="text-base font-bold text-stone-800 border-b border-stone-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

export default function FeatureForm({ initial, id }: { initial?: FeatureFormValues & { layers: LayerInput[]; artifacts: ArtifactInput[] }; id?: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState<FeatureFormValues>(initial ? { ...defaultValues, ...initial } : defaultValues);
  const [layers, setLayers] = useState<LayerInput[]>(initial?.layers?.length ? initial.layers : [emptyLayer()]);
  const [artifacts, setArtifacts] = useState<ArtifactInput[]>(initial?.artifacts?.length ? initial.artifacts : [emptyArtifact()]);

  const set = (key: keyof FeatureFormValues, value: string) => setForm(f => ({ ...f, [key]: value }));
  const setLayer = (i: number, key: keyof LayerInput, value: string) => setLayers(ls => ls.map((l, idx) => idx === i ? { ...l, [key]: value } : l));
  const setArtifact = (i: number, key: keyof ArtifactInput, value: string) => setArtifacts(as => as.map((a, idx) => idx === i ? { ...a, [key]: value } : a));

  const addLayer = () => setLayers(ls => [...ls, emptyLayer()]);
  const delLayer = (i: number) => setLayers(ls => ls.filter((_, idx) => idx !== i));
  const addArtifact = () => setArtifacts(as => [...as, emptyArtifact()]);
  const delArtifact = (i: number) => setArtifacts(as => as.filter((_, idx) => idx !== i));

  const handleImport = async () => {
    const num = form.feature_number.trim();
    if (!num) { alert('请先填写遗迹号'); return; }
    setImporting(true);
    try {
      const res = await fetch(`/api/excavation/import?feature_number=${encodeURIComponent(num)}`);
      const data = await res.json();
      if (!res.ok) { alert(data.error || '导入失败'); return; }
      const imported = data.feature as FeatureFormValues & { layers: LayerInput[]; artifacts: ArtifactInput[] };
      setForm(f => {
        const next = { ...f };
        for (const [k, v] of Object.entries(imported)) {
          if (k === 'layers' || k === 'artifacts') continue;
          if (typeof v === 'string' && v.trim()) next[k as keyof FeatureFormValues] = v;
        }
        return next;
      });
      if (imported.layers?.length) setLayers(imported.layers);
      if (imported.artifacts?.length) setArtifacts(imported.artifacts);
      alert('已从日记导入，请核对后保存');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.feature_number.trim()) { alert('遗迹号不能为空'); return; }
    setSaving(true);
    const payload = { ...form, layers, artifacts };
    const res = await fetch(id ? `/api/excavation/${id}` : '/api/excavation', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/excavation/${data.id}`);
    } else {
      const data = await res.json();
      alert(data.error || '保存失败');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="基本信息">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleImport} disabled={importing} className="px-3 py-2 rounded-lg text-sm bg-stone-800 text-white hover:bg-stone-900 disabled:opacity-50">
            {importing ? '导入中…' : '从日记导入'}
          </button>
          <span className="text-xs text-stone-400">按遗迹号从已保存的考古日记回填内容</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="遗迹号" required>
            <input className={inputCls} value={form.feature_number} onChange={e => set('feature_number', e.target.value)} placeholder="如 H50" />
          </Field>
          <Field label="遗迹类型">
            <input className={inputCls} value={form.feature_type} onChange={e => set('feature_type', e.target.value)} placeholder="如 灰坑" list="feature-types" />
            <datalist id="feature-types">
              <option value="灰坑" /><option value="灶" /><option value="柱洞" /><option value="沟" /><option value="房址" />
            </datalist>
          </Field>
          <Field label="探方号">
            <input className={inputCls} value={form.trench_number} onChange={e => set('trench_number', e.target.value)} placeholder="如 TN09E04" />
          </Field>
          <Field label="遗址名">
            <input className={inputCls} value={form.site_name} onChange={e => set('site_name', e.target.value)} />
          </Field>
          <Field label="年度">
            <input className={inputCls} value={form.year} onChange={e => set('year', e.target.value)} />
          </Field>
          <Field label="区位">
            <input className={inputCls} value={form.district} onChange={e => set('district', e.target.value)} placeholder="如 东1区" />
          </Field>
          <Field label="记录日期">
            <input className={inputCls} value={form.record_date} onChange={e => set('record_date', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="位置">
            <input className={inputCls} value={form.position} onChange={e => set('position', e.target.value)} />
          </Field>
          <Field label="形状">
            <input className={inputCls} value={form.shape} onChange={e => set('shape', e.target.value)} />
          </Field>
          <Field label="口部尺寸">
            <input className={inputCls} value={form.opening_size} onChange={e => set('opening_size', e.target.value)} />
          </Field>
          <Field label="深度">
            <input className={inputCls} value={form.depth} onChange={e => set('depth', e.target.value)} />
          </Field>
          <Field label="底部尺寸">
            <input className={inputCls} value={form.bottom_size} onChange={e => set('bottom_size', e.target.value)} />
          </Field>
          <Field label="摄影">
            <input className={inputCls} value={form.photo_info} onChange={e => set('photo_info', e.target.value)} />
          </Field>
        </div>
        <Field label="绘图号与图名">
          <textarea rows={2} className={inputCls} value={form.drawing_info} onChange={e => set('drawing_info', e.target.value)} />
        </Field>
      </Section>

      <Section title="发掘记录内容">
        <Field label="发掘经过">
          <textarea rows={5} className={inputCls} value={form.excavation_process} onChange={e => set('excavation_process', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="坑壁与底的细节">
            <textarea rows={3} className={inputCls} value={form.wall_bottom_detail} onChange={e => set('wall_bottom_detail', e.target.value)} />
          </Field>
          <Field label="层位关系">
            <textarea rows={3} className={inputCls} value={form.stratigraphy} onChange={e => set('stratigraphy', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="年代推断">
            <textarea rows={2} className={inputCls} value={form.dating} onChange={e => set('dating', e.target.value)} />
          </Field>
          <Field label="性质功能">
            <input className={inputCls} value={form.function_nature} onChange={e => set('function_nature', e.target.value)} />
          </Field>
        </div>
        <Field label="采样">
          <textarea rows={2} className={inputCls} value={form.sampling} onChange={e => set('sampling', e.target.value)} />
        </Field>
        <Field label="备注">
          <textarea rows={2} className={inputCls} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="记录者">
            <input className={inputCls} value={form.recorder} onChange={e => set('recorder', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="堆积层">
        {layers.map((l, i) => (
          <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">堆积层 {i + 1}</span>
              <button type="button" onClick={() => delLayer(i)} className="text-xs text-red-500 hover:text-red-700">删除</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Field label="层号"><input className={inputCls} value={l.layer_number} onChange={e => setLayer(i, 'layer_number', e.target.value)} placeholder="①" /></Field>
              <Field label="土色"><input className={inputCls} value={l.soil_color} onChange={e => setLayer(i, 'soil_color', e.target.value)} /></Field>
              <Field label="土质"><input className={inputCls} value={l.soil_texture} onChange={e => setLayer(i, 'soil_texture', e.target.value)} /></Field>
              <Field label="致密度"><input className={inputCls} value={l.density} onChange={e => setLayer(i, 'density', e.target.value)} /></Field>
              <Field label="厚度"><input className={inputCls} value={l.thickness} onChange={e => setLayer(i, 'thickness', e.target.value)} /></Field>
              <Field label="堆积形状"><input className={inputCls} value={l.deposit_shape} onChange={e => setLayer(i, 'deposit_shape', e.target.value)} /></Field>
              <Field label="保存状况"><input className={inputCls} value={l.preservation} onChange={e => setLayer(i, 'preservation', e.target.value)} /></Field>
              <Field label="堆积性质"><input className={inputCls} value={l.deposit_nature} onChange={e => setLayer(i, 'deposit_nature', e.target.value)} /></Field>
            </div>
            <Field label="包含物"><textarea rows={2} className={inputCls} value={l.inclusions} onChange={e => setLayer(i, 'inclusions', e.target.value)} /></Field>
            <Field label="清理方式"><textarea rows={2} className={inputCls} value={l.cleaning_method} onChange={e => setLayer(i, 'cleaning_method', e.target.value)} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Field label="深度"><input className={inputCls} value={l.depth_text} onChange={e => setLayer(i, 'depth_text', e.target.value)} /></Field>
              <Field label="备注"><input className={inputCls} value={l.remarks} onChange={e => setLayer(i, 'remarks', e.target.value)} /></Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLayer} className="text-sm text-amber-700 hover:text-amber-800">+ 添加堆积层</button>
      </Section>

      <Section title="遗物">
        {artifacts.map((a, i) => (
          <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-600">遗物 {i + 1}</span>
              <button type="button" onClick={() => delArtifact(i)} className="text-xs text-red-500 hover:text-red-700">删除</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Field label="所属层"><input className={inputCls} value={a.layer_number} onChange={e => setArtifact(i, 'layer_number', e.target.value)} placeholder="①" /></Field>
              <Field label="类型"><input className={inputCls} value={a.type} onChange={e => setArtifact(i, 'type', e.target.value)} placeholder="陶片" /></Field>
              <Field label="数量"><input className={inputCls} value={a.quantity} onChange={e => setArtifact(i, 'quantity', e.target.value)} placeholder="1袋" /></Field>
              <Field label="编号"><input className={inputCls} value={a.number} onChange={e => setArtifact(i, 'number', e.target.value)} /></Field>
              <Field label="备注"><input className={inputCls} value={a.remarks} onChange={e => setArtifact(i, 'remarks', e.target.value)} /></Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={addArtifact} className="text-sm text-amber-700 hover:text-amber-800">+ 添加遗物</button>
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-amber-700 text-white px-6 py-2 rounded-lg text-sm hover:bg-amber-800 disabled:opacity-50">
          {saving ? '保存中…' : '保存'}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg text-sm border border-stone-300 text-stone-600 hover:bg-stone-100">取消</button>
      </div>
    </form>
  );
}
