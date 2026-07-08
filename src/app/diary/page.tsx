'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface DiaryRecord {
  id: number;
  diary_date: string;
  weather: string;
  trench_number: string;
  recorder: string;
  content: string;
  created_at: string;
}

const defaultForm = {
  diary_date: new Date().toISOString().slice(0, 10),
  weather: '晴',
  trench_number: '',
  trench_location: '',
  trench_spec: '5米×5米',
  recorder: '',
  // 地层发掘
  layer_number: '①',
  excavate_start: '上午',
  excavate_method: '水平发掘法',
  excavate_tool: '铁锹',
  excavate_depth: '',
  use_sieve: '否',
  soil_texture: '',
  soil_color: '',
  soil_density: '较疏松',
  inclusions: '',
  has_feature: '否',
  feature_observation: '',
  layer_thickness: '',
  layer_nature: '',
  corner_depth_ne: '',
  corner_depth_se: '',
  corner_depth_sw: '',
  corner_depth_nw: '',
  // 遗迹发掘
  feature_number: '',
  feature_type: '灰坑',
  feature_opening: '',
  feature_break_relation: '',
  feature_shape: '圆形',
  feature_dimensions: '',
  feature_excavate_method: '1/2发掘法',
  feature_section_dir: '正南北',
  feature_layers: [{ layer: '①', texture: '', color: '', thickness: '', inclusions: '' }],
  soil_samples: '',
  artifacts_recovered: '',
  feature_complete: '完全清理',
  has_photo: '是',
  photo_description: '用相机拍照',
  has_drawing: '是',
  drawing_description: '现场绘制平、剖面图',
  // 总结
  summary: '',
  plan: '',
  // 小件
  small_finds: '',
};

export default function DiaryPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-400">加载中…</div>}>
      <DiaryContent />
    </Suspense>
  );
}

function DiaryContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState(defaultForm);
  const [generatedText, setGeneratedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  const [diaries, setDiaries] = useState<DiaryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [expandedSection, setExpandedSection] = useState<string>('basic');

  const updateForm = (key: string, value: unknown) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const updateFeatureLayer = (idx: number, key: string, value: string) => {
    setForm(f => {
      const layers = [...f.feature_layers];
      layers[idx] = { ...layers[idx], [key]: value };
      return { ...f, feature_layers: layers };
    });
  };

  const addFeatureLayer = () => {
    setForm(f => ({
      ...f,
      feature_layers: [...f.feature_layers, { layer: '', texture: '', color: '', thickness: '', inclusions: '' }],
    }));
  };

  const removeFeatureLayer = (idx: number) => {
    setForm(f => ({
      ...f,
      feature_layers: f.feature_layers.filter((_, i) => i !== idx),
    }));
  };

  const generateDiary = () => {
    const lines: string[] = [];

    // Header
    lines.push(`${form.diary_date} ${form.weather}`);
    lines.push(`探方：${form.trench_number || '（未填）'}`);
    lines.push('');

    // Section 1: 探方概况
    lines.push('一、探方概况');
    if (form.trench_location) lines.push(form.trench_location);
    if (form.trench_spec) lines.push(`探方规格：${form.trench_spec}，保留东隔梁和北隔梁，宽1米。`);
    lines.push('');

    // Section 2: 地层发掘
    lines.push('二、地层发掘');
    const timeStr = form.excavate_start === '上午' ? '上午' : '下午';
    lines.push(`${form.diary_date}${timeStr}，继续发掘${form.layer_number}层。按照${form.excavate_method}，自东向西，使用${form.excavate_tool}对${form.layer_number}层进行清理，发掘深度${form.excavate_depth || '（未填）'}厘米。${form.use_sieve === '是' ? `对${form.layer_number}层堆积用筛网进行筛选，尽可能仔细地收集出土遗物。` : `并未对${form.layer_number}层堆积用筛网进行筛选，尽可能仔细地收集出土遗物。`}`);

    const soilParts = [form.soil_color, form.soil_texture].filter(Boolean).join('');
    if (soilParts || form.soil_density || form.inclusions) {
      const descParts = [];
      if (soilParts) descParts.push(soilParts);
      if (form.soil_density) descParts.push(`较${form.soil_density === '疏松' ? '' : '为'}${form.soil_density}`);
      if (form.inclusions) descParts.push(`包含${form.inclusions}`);
      lines.push(`${form.layer_number}层为${descParts.join('，')}。`);
    }

    if (form.has_feature === '是' && form.feature_observation) {
      lines.push(form.feature_observation);
    } else if (form.has_feature === '否') {
      lines.push(`用手铲对整个探方进行刮面，并未发现明显的遗迹现象，故继续向下清理。`);
    }

    lines.push(`至${form.diary_date}${timeStr}，${form.layer_number}层清理完毕。`);
    if (form.layer_thickness) {
      const layerDescParts = [`${form.layer_number}层水平分布于全方，厚${form.layer_thickness}厘米`];
      if (soilParts) layerDescParts.push(`为${soilParts}`);
      if (form.soil_density) layerDescParts.push(`较${form.soil_density === '疏松' ? '' : '为'}${form.soil_density}`);
      if (form.inclusions) layerDescParts.push(`包含${form.inclusions}`);
      lines.push(`${layerDescParts.join('，')}。`);
    }
    if (form.layer_nature) {
      lines.push(`应为${form.layer_nature}。`);
    }

    if (form.corner_depth_ne || form.corner_depth_se || form.corner_depth_sw || form.corner_depth_nw) {
      const corners = [
        form.corner_depth_ne && `东北${form.corner_depth_ne}cm`,
        form.corner_depth_se && `东南${form.corner_depth_se}cm`,
        form.corner_depth_sw && `西南${form.corner_depth_sw}cm`,
        form.corner_depth_nw && `西北${form.corner_depth_nw}cm`,
      ].filter(Boolean).join('，');
      lines.push(`四角发掘深度：${corners}。`);
    }
    lines.push('');

    // Section 3: 遗迹发掘
    if (form.feature_number) {
      lines.push('三、遗迹发掘');
      lines.push(`${form.diary_date}，开始对${form.feature_number}进行发掘。${form.feature_number}位于探方内，开口于${form.feature_opening || '（未填）'}层下${form.feature_break_relation ? `，${form.feature_break_relation}` : ''}。${form.feature_number}平面呈${form.feature_shape}${form.feature_dimensions ? `，${form.feature_dimensions}` : ''}。`);

      if (form.feature_excavate_method) {
        const half = form.feature_excavate_method.includes('1/2') ? '先发掘东半部' : '';
        lines.push(`采用${form.feature_excavate_method}对${form.feature_number}进行解剖发掘，解剖方向为${form.feature_section_dir}${half ? `，${half}` : ''}。`);
      }

      // Layer descriptions
      for (const fl of form.feature_layers) {
        if (!fl.layer && !fl.texture && !fl.color && !fl.thickness && !fl.inclusions) continue;
        const flSoil = [fl.color, fl.texture].filter(Boolean).join('');
        const flDesc = [flSoil, fl.inclusions].filter(Boolean).join('，包含');
        const thicknessStr = fl.thickness ? `发掘深度${fl.thickness}厘米` : '';
        lines.push(`使用铁锹对${form.feature_excavate_method.includes('1/2') ? '东半部' : ''}${fl.layer}层进行清理${thicknessStr ? `，${thicknessStr}` : ''}。堆积过筛，收集全部出土遗物。`);
        if (flDesc || fl.thickness) {
          const summary = [`${fl.layer}层堆积${flDesc}`];
          if (fl.thickness) summary.push(`厚${fl.thickness}厘米`);
          lines.push(`${summary.join('，')}。`);
        }
      }

      if (form.soil_samples) {
        lines.push(`土样采集：${form.soil_samples}。`);
      }
      if (form.artifacts_recovered) {
        lines.push(`出土遗物：${form.artifacts_recovered}。`);
      }

      lines.push(`至${form.diary_date}，${form.feature_number}${form.feature_complete === '完全清理' ? '全部清理完毕' : '部分清理'}。`);
      if (form.has_photo === '是') lines.push(`${form.photo_description || '用相机对其进行拍照'}。`);
      if (form.has_drawing === '是') lines.push(`${form.drawing_description || '现场绘制平、剖面图'}。`);
      lines.push('');
    }

    // Section 4: 总结与计划
    lines.push(form.feature_number ? '四、总结与计划' : '三、总结与计划');
    if (form.summary) lines.push(form.summary);
    if (form.plan) lines.push(`计划：${form.plan}`);
    lines.push('');

    // Section 5: 小件
    if (form.small_finds) {
      lines.push(form.feature_number ? '五、小件登记' : '四、小件登记');
      lines.push(form.small_finds);
      lines.push('');
    }

    // Footer
    if (form.recorder) {
      lines.push(`记录人：${form.recorder}`);
    }

    setGeneratedText(lines.join('\n'));
  };

  const handleSave = async () => {
    if (!generatedText) { alert('请先生成日记'); return; }
    setSaving(true);
    const res = await fetch('/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diary_date: form.diary_date,
        weather: form.weather,
        trench_number: form.trench_number,
        recorder: form.recorder,
        content: generatedText,
      }),
    });
    if (res.ok) {
      alert('保存成功');
      fetchDiaries();
    } else {
      const data = await res.json();
      alert(data.error || '保存失败');
    }
    setSaving(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopyMsg('已复制到剪贴板');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('复制失败');
      setTimeout(() => setCopyMsg(''), 2000);
    }
  };

  const fetchDiaries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '10');
    const res = await fetch(`/api/diaries?${params}`);
    const data = await res.json();
    setDiaries(data.data || []);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchDiaries(); }, [fetchDiaries]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此日记吗？')) return;
    const res = await fetch(`/api/diaries/${id}`, { method: 'DELETE' });
    if (res.ok) fetchDiaries();
  };

  const handleView = (diary: DiaryRecord) => {
    setGeneratedText(diary.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass = 'w-full px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const labelClass = 'block text-xs font-medium text-stone-600 mb-1';
  const sectionClass = 'bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-stone-800">考古日记生成</h2>

      {/* Form */}
      <div className="space-y-3">
        {/* Section 1: 基本信息 */}
        <div className={sectionClass}>
          <button type="button" onClick={() => setExpandedSection(s => s === 'basic' ? '' : 'basic')}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
            <span>📋 基本信息</span>
            <span className="text-stone-400">{expandedSection === 'basic' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'basic' && (
            <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>日期</label>
                <input type="date" value={form.diary_date} onChange={e => updateForm('diary_date', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>天气</label>
                <select value={form.weather} onChange={e => updateForm('weather', e.target.value)} className={inputClass}>
                  <option>晴</option><option>阴</option><option>雨</option><option>多云</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>探方编号</label>
                <input value={form.trench_number} onChange={e => updateForm('trench_number', e.target.value)} className={inputClass} placeholder="如 T0101" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>探方位置描述</label>
                <input value={form.trench_location} onChange={e => updateForm('trench_location', e.target.value)} className={inputClass} placeholder="位于遗址东部，探方北邻…，南邻…" />
              </div>
              <div>
                <label className={labelClass}>探方规格</label>
                <input value={form.trench_spec} onChange={e => updateForm('trench_spec', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>记录人</label>
                <input value={form.recorder} onChange={e => updateForm('recorder', e.target.value)} className={inputClass} />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: 地层发掘 */}
        <div className={sectionClass}>
          <button type="button" onClick={() => setExpandedSection(s => s === 'layer' ? '' : 'layer')}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
            <span>🔍 地层发掘</span>
            <span className="text-stone-400">{expandedSection === 'layer' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'layer' && (
            <div className="px-5 pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>层位编号</label>
                  <input value={form.layer_number} onChange={e => updateForm('layer_number', e.target.value)} className={inputClass} placeholder="①、②" />
                </div>
                <div>
                  <label className={labelClass}>发掘时间</label>
                  <select value={form.excavate_start} onChange={e => updateForm('excavate_start', e.target.value)} className={inputClass}>
                    <option>上午</option><option>下午</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>发掘方法</label>
                  <input value={form.excavate_method} onChange={e => updateForm('excavate_method', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>使用工具</label>
                  <input value={form.excavate_tool} onChange={e => updateForm('excavate_tool', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>发掘深度（cm）</label>
                  <input type="number" value={form.excavate_depth} onChange={e => updateForm('excavate_depth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>是否过筛</label>
                  <select value={form.use_sieve} onChange={e => updateForm('use_sieve', e.target.value)} className={inputClass}>
                    <option>否</option><option>是</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>土色</label>
                  <input value={form.soil_color} onChange={e => updateForm('soil_color', e.target.value)} className={inputClass} placeholder="浅褐色" />
                </div>
                <div>
                  <label className={labelClass}>土质</label>
                  <input value={form.soil_texture} onChange={e => updateForm('soil_texture', e.target.value)} className={inputClass} placeholder="粗沙土" />
                </div>
                <div>
                  <label className={labelClass}>致密度</label>
                  <select value={form.soil_density} onChange={e => updateForm('soil_density', e.target.value)} className={inputClass}>
                    <option>疏松</option><option>较致密</option><option>致密</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>包含物</label>
                  <input value={form.inclusions} onChange={e => updateForm('inclusions', e.target.value)} className={inputClass} placeholder="植物根茎、烧土粒、炭屑" />
                </div>
                <div>
                  <label className={labelClass}>地层厚度（cm）</label>
                  <input type="number" value={form.layer_thickness} onChange={e => updateForm('layer_thickness', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>性质判断</label>
                  <input value={form.layer_nature} onChange={e => updateForm('layer_nature', e.target.value)} className={inputClass} placeholder="现代耕土层、明清文化层" />
                </div>
              </div>

              <div>
                <label className={labelClass}>遗迹现象</label>
                <div className="flex gap-2 mb-2">
                  <select value={form.has_feature} onChange={e => updateForm('has_feature', e.target.value)} className={`${inputClass} w-24`}>
                    <option>否</option><option>是</option>
                  </select>
                </div>
                {form.has_feature === '是' && (
                  <textarea value={form.feature_observation} onChange={e => updateForm('feature_observation', e.target.value)} className={inputClass} rows={2}
                    placeholder="如：发掘至深10厘米处，用手铲对整个探方进行刮面，发现一平面呈规则圆形的遗迹…" />
                )}
              </div>

              <div>
                <label className={labelClass}>四角发掘深度（cm，可选）</label>
                <div className="grid grid-cols-4 gap-2">
                  <input value={form.corner_depth_ne} onChange={e => updateForm('corner_depth_ne', e.target.value)} className={inputClass} placeholder="东北" />
                  <input value={form.corner_depth_se} onChange={e => updateForm('corner_depth_se', e.target.value)} className={inputClass} placeholder="东南" />
                  <input value={form.corner_depth_sw} onChange={e => updateForm('corner_depth_sw', e.target.value)} className={inputClass} placeholder="西南" />
                  <input value={form.corner_depth_nw} onChange={e => updateForm('corner_depth_nw', e.target.value)} className={inputClass} placeholder="西北" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: 遗迹发掘 (optional) */}
        <div className={sectionClass}>
          <button type="button" onClick={() => setExpandedSection(s => s === 'feature' ? '' : 'feature')}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
            <span>🏺 遗迹发掘（选填）</span>
            <span className="text-stone-400">{expandedSection === 'feature' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'feature' && (
            <div className="px-5 pb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>遗迹编号</label>
                  <input value={form.feature_number} onChange={e => updateForm('feature_number', e.target.value)} className={inputClass} placeholder="2024HSCH100" />
                </div>
                <div>
                  <label className={labelClass}>遗迹类型</label>
                  <select value={form.feature_type} onChange={e => updateForm('feature_type', e.target.value)} className={inputClass}>
                    <option>灰坑</option><option>灰沟</option><option>房址</option><option>墓葬</option><option>其他</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>开口层位</label>
                  <input value={form.feature_opening} onChange={e => updateForm('feature_opening', e.target.value)} className={inputClass} placeholder="②层下" />
                </div>
                <div>
                  <label className={labelClass}>打破关系</label>
                  <input value={form.feature_break_relation} onChange={e => updateForm('feature_break_relation', e.target.value)} className={inputClass} placeholder="打破位于其北侧的沟状遗迹" />
                </div>
                <div>
                  <label className={labelClass}>平面形状</label>
                  <select value={form.feature_shape} onChange={e => updateForm('feature_shape', e.target.value)} className={inputClass}>
                    <option>圆形</option><option>长方形</option><option>不规则形</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>尺寸</label>
                  <input value={form.feature_dimensions} onChange={e => updateForm('feature_dimensions', e.target.value)} className={inputClass} placeholder="直径80~85厘米" />
                </div>
                <div>
                  <label className={labelClass}>发掘方法</label>
                  <select value={form.feature_excavate_method} onChange={e => updateForm('feature_excavate_method', e.target.value)} className={inputClass}>
                    <option>1/2发掘法</option><option>全面发掘</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>解剖方向</label>
                  <select value={form.feature_section_dir} onChange={e => updateForm('feature_section_dir', e.target.value)} className={inputClass}>
                    <option>正南北</option><option>正东西</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>完工状态</label>
                  <select value={form.feature_complete} onChange={e => updateForm('feature_complete', e.target.value)} className={inputClass}>
                    <option>完全清理</option><option>部分清理</option>
                  </select>
                </div>
              </div>

              {/* Feature layers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>堆积描述</label>
                  <button type="button" onClick={addFeatureLayer} className="text-xs text-amber-700 hover:text-amber-800">+ 添加层</button>
                </div>
                {form.feature_layers.map((fl, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
                    <input value={fl.layer} onChange={e => updateFeatureLayer(idx, 'layer', e.target.value)} className={inputClass} placeholder="层号" />
                    <input value={fl.texture} onChange={e => updateFeatureLayer(idx, 'texture', e.target.value)} className={inputClass} placeholder="土质" />
                    <input value={fl.color} onChange={e => updateFeatureLayer(idx, 'color', e.target.value)} className={inputClass} placeholder="土色" />
                    <input value={fl.thickness} onChange={e => updateFeatureLayer(idx, 'thickness', e.target.value)} className={inputClass} placeholder="厚度cm" />
                    <div className="flex gap-1">
                      <input value={fl.inclusions} onChange={e => updateFeatureLayer(idx, 'inclusions', e.target.value)} className={inputClass} placeholder="包含物" />
                      {form.feature_layers.length > 1 && (
                        <button type="button" onClick={() => removeFeatureLayer(idx)} className="text-red-500 text-xs shrink-0">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>土样采集</label>
                  <input value={form.soil_samples} onChange={e => updateForm('soil_samples', e.target.value)} className={inputClass} placeholder="①层浮选土样1份" />
                </div>
                <div>
                  <label className={labelClass}>出土遗物</label>
                  <input value={form.artifacts_recovered} onChange={e => updateForm('artifacts_recovered', e.target.value)} className={inputClass} placeholder="①层陶片2袋、骨骼碎片2袋" />
                </div>
                <div>
                  <label className={labelClass}>拍照</label>
                  <select value={form.has_photo} onChange={e => updateForm('has_photo', e.target.value)} className={inputClass}>
                    <option>是</option><option>否</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>绘图</label>
                  <select value={form.has_drawing} onChange={e => updateForm('has_drawing', e.target.value)} className={inputClass}>
                    <option>是</option><option>否</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: 总结与计划 + 小件 */}
        <div className={sectionClass}>
          <button type="button" onClick={() => setExpandedSection(s => s === 'summary' ? '' : 'summary')}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
            <span>📝 总结、计划与小件登记</span>
            <span className="text-stone-400">{expandedSection === 'summary' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'summary' && (
            <div className="px-5 pb-4 space-y-3">
              <div>
                <label className={labelClass}>本日工作总结</label>
                <textarea value={form.summary} onChange={e => updateForm('summary', e.target.value)} className={inputClass} rows={3}
                  placeholder="将XX层清理完毕后，对XX层下进行整体刮面…" />
              </div>
              <div>
                <label className={labelClass}>明日计划</label>
                <textarea value={form.plan} onChange={e => updateForm('plan', e.target.value)} className={inputClass} rows={2}
                  placeholder="计划明日发掘XX层…" />
              </div>
              <div>
                <label className={labelClass}>小件登记（选填）</label>
                <textarea value={form.small_finds} onChange={e => updateForm('small_finds', e.target.value)} className={inputClass} rows={2}
                  placeholder="描述出土小件，包括形制、坐标等" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate button */}
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={generateDiary}
          className="bg-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors">
          生成日记
        </button>
      </div>

      {/* Preview */}
      {generatedText && (
        <div className={sectionClass}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
            <span className="text-sm font-medium text-stone-700">日记预览</span>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="text-xs px-3 py-1 rounded border border-stone-300 text-stone-600 hover:bg-stone-50">
                {copyMsg || '复制'}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="text-xs px-3 py-1 rounded bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
          <pre className="px-5 py-4 text-sm text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{generatedText}</pre>
        </div>
      )}

      {/* History list */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <span className="text-sm font-medium text-stone-700">已保存日记</span>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-stone-400 text-sm">加载中…</div>
        ) : diaries.length === 0 ? (
          <div className="px-5 py-8 text-center text-stone-400 text-sm">暂无日记</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {diaries.map(d => (
              <div key={d.id} className="px-5 py-3 hover:bg-stone-50 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-stone-800 truncate">
                    {d.diary_date} {d.weather} {d.trench_number && `· ${d.trench_number}`}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5 truncate">
                    {d.content.slice(0, 80)}…
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <button onClick={() => handleView(d)} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200">查看</button>
                  <button onClick={() => handleDelete(d.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 text-sm">
            <span className="text-stone-500">共 {total} 条</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">上一页</button>
              <span className="px-3 py-1 text-stone-600">第 {page}/{totalPages} 页</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
