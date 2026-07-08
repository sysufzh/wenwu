'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface DiaryRecord {
  id: number;
  diary_date: string;
  weather: string;
  wind_direction: string;
  humidity: string;
  trench_number: string;
  recorder: string;
  content: string;
  created_at: string;
}

interface FeaturePanel {
  feature_number: string;
  feature_type: string;
  feature_opening: string;
  break_relation: string;
  shape: string;
  dimensions: string;
  excavate_method: string;
  section_dir: string;
  complete_status: string;
  deposit_description: string;
  excavate_depth: string;
  feature_layers: { layer: string; texture: string; color: string; thickness: string; inclusions: string }[];
  soil_samples: string;
  artifacts: string;
  has_photo: string;
  photo_desc: string;
  has_drawing: string;
  drawing_desc: string;
}

const emptyFeature = (): FeaturePanel => ({
  feature_number: '',
  feature_type: '灰坑',
  feature_opening: '',
  break_relation: '',
  shape: '圆形',
  dimensions: '',
  excavate_method: '1/2发掘法',
  section_dir: '',
  complete_status: '二分之一完成',
  deposit_description: '',
  excavate_depth: '',
  feature_layers: [{ layer: '①', texture: '', color: '', thickness: '', inclusions: '' }],
  soil_samples: '',
  artifacts: '',
  has_photo: '是',
  photo_desc: '用相机拍照',
  has_drawing: '是',
  drawing_desc: '现场绘制平、剖面图',
});

const defaultForm = {
  diary_date: new Date().toISOString().slice(0, 10),
  weather: '晴',
  wind_direction: '',
  humidity: '',
  trench_number: '',
  recorder: '',
  // Work sections
  has_layer_excavation: true,
  has_scraping: false,
  has_feature_excavation: false,
  // Layer
  layer_number: '①',
  excavate_direction: '',
  work_progress: '',
  excavate_time_start: '',
  excavate_time_end: '',
  excavate_method: '水平发掘法',
  excavate_tool: '铁锹',
  use_sieve: '否',
  soil_texture: '',
  soil_color: '',
  soil_density: '较疏松',
  inclusions: '',
  artifacts_found: '',
  has_special_feature: '否',
  special_feature_desc: '',
  corner_depth_ne: '',
  corner_depth_se: '',
  corner_depth_sw: '',
  corner_depth_nw: '',
  layer_completed: '否',
  layer_thickness_for_summary: '',
  layer_nature: '',
  // Scraping
  scrape_progress: '全方一次',
  scrape_direction: '',
  scrape_observation: '',
  // Feature panels
  feature_panels: [emptyFeature()],
  // Summary
  work_summary: '',
  tomorrow_plan: '',
  specimen_register: '',
  small_finds_register: '',
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

  const updateForm = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const updateFeature = (idx: number, key: string, value: unknown) => {
    setForm(f => {
      const panels = [...f.feature_panels];
      panels[idx] = { ...panels[idx], [key]: value };
      return { ...f, feature_panels: panels };
    });
  };

  const updateFeatureLayer = (pIdx: number, lIdx: number, key: string, value: string) => {
    setForm(f => {
      const panels = [...f.feature_panels];
      const layers = [...panels[pIdx].feature_layers];
      layers[lIdx] = { ...layers[lIdx], [key]: value };
      panels[pIdx] = { ...panels[pIdx], feature_layers: layers };
      return { ...f, feature_panels: panels };
    });
  };

  const addFeatureLayer = (pIdx: number) => {
    setForm(f => {
      const panels = [...f.feature_panels];
      panels[pIdx] = { ...panels[pIdx], feature_layers: [...panels[pIdx].feature_layers, { layer: '', texture: '', color: '', thickness: '', inclusions: '' }] };
      return { ...f, feature_panels: panels };
    });
  };

  const removeFeatureLayer = (pIdx: number, lIdx: number) => {
    setForm(f => {
      const panels = [...f.feature_panels];
      panels[pIdx] = { ...panels[pIdx], feature_layers: panels[pIdx].feature_layers.filter((_, i) => i !== lIdx) };
      return { ...f, feature_panels: panels };
    });
  };

  const addFeaturePanel = () => {
    setForm(f => ({ ...f, feature_panels: [...f.feature_panels, emptyFeature()] }));
  };

  const removeFeaturePanel = (idx: number) => {
    setForm(f => ({ ...f, feature_panels: f.feature_panels.filter((_, i) => i !== idx) }));
  };

  const validate = (): string | null => {
    if (!form.diary_date) return '请填写日期';
    if (!form.weather) return '请选择天气';
    if (!form.wind_direction) return '请填写风向';
    if (!form.humidity) return '请填写湿度';
    if (!form.trench_number) return '请填写探方编号';
    if (!form.recorder) return '请填写记录人';

    if (!form.has_layer_excavation && !form.has_scraping && !form.has_feature_excavation) {
      return '地层发掘、刮面、遗迹发掘中至少选择一项';
    }

    if (form.has_layer_excavation) {
      if (!form.layer_number) return '请填写层位编号';
      if (!form.excavate_direction) return '请填写发掘方向';
      if (!form.work_progress) return '请填写工作进度';
      if (!form.excavate_time_start || !form.excavate_time_end) return '请填写发掘时间区间';
      if (!form.soil_texture) return '请填写土质';
      if (!form.soil_color) return '请填写土色';
      if (!form.corner_depth_ne && !form.corner_depth_se && !form.corner_depth_sw && !form.corner_depth_nw) return '请填写四角发掘深度';
      if (form.has_special_feature === '是' && !form.special_feature_desc) return '请描述特殊遗迹现象';
    }

    if (form.has_scraping) {
      if (!form.scrape_direction) return '请填写刮面方向';
    }

    if (form.has_feature_excavation) {
      for (let i = 0; i < form.feature_panels.length; i++) {
        const fp = form.feature_panels[i];
        if (!fp.feature_number) return `遗迹${i + 1}：请填写遗迹编号`;
        if (!fp.feature_type) return `遗迹${i + 1}：请选择遗迹类型`;
        if (!fp.feature_opening) return `遗迹${i + 1}：请填写开口层位`;
        if (!fp.break_relation) return `遗迹${i + 1}：请填写打破关系`;
        if (!fp.shape) return `遗迹${i + 1}：请选择平面形状`;
        if (!fp.dimensions) return `遗迹${i + 1}：请填写尺寸`;
        if (!fp.excavate_method) return `遗迹${i + 1}：请填写发掘方法`;
        if (!fp.section_dir) return `遗迹${i + 1}：请填写解剖方向`;
        if (!fp.complete_status) return `遗迹${i + 1}：请选择完工状态`;
      }
    }

    return null;
  };

  const generateDiary = () => {
    const err = validate();
    if (err) { alert(err); return; }

    const lines: string[] = [];

    // Header
    lines.push(`${form.diary_date} ${form.weather} 风向${form.wind_direction} 湿度${form.humidity}`);
    lines.push(`探方：${form.trench_number}`);
    lines.push(`记录人：${form.recorder}`);
    lines.push('');

    // Section 1: 地层发掘
    if (form.has_layer_excavation) {
      lines.push('一、地层发掘');
      lines.push(`今日继续发掘${form.layer_number}层。发掘方向${form.excavate_direction}，工作进度：${form.work_progress}。`);
      lines.push(`${form.excavate_time_start}至${form.excavate_time_end}，按照${form.excavate_method}，使用${form.excavate_tool}对${form.layer_number}层进行清理。${form.use_sieve === '是' ? `对${form.layer_number}层堆积用筛网进行筛选，尽可能仔细地收集出土遗物。` : `并未对${form.layer_number}层堆积用筛网进行筛选，尽可能仔细地收集出土遗物。`}`);

      const soilDesc = [form.soil_color, form.soil_texture].filter(Boolean).join('');
      const densityStr = form.soil_density === '疏松' ? '疏松' : form.soil_density === '较致密' ? '较致密' : '致密';
      const descParts: string[] = [];
      if (soilDesc) descParts.push(soilDesc);
      descParts.push(`较${densityStr === '疏松' ? '' : '为'}${densityStr}`);
      if (form.inclusions) descParts.push(`包含${form.inclusions}`);
      lines.push(`${form.layer_number}层为${descParts.join('，')}。`);

      if (form.artifacts_found) {
        lines.push(`出土物：${form.artifacts_found}。`);
      }

      if (form.has_special_feature === '是') {
        lines.push(`在发掘过程中发现特殊遗迹现象：${form.special_feature_desc}。`);
      }

      const corners = [
        form.corner_depth_ne && `东北${form.corner_depth_ne}cm`,
        form.corner_depth_se && `东南${form.corner_depth_se}cm`,
        form.corner_depth_sw && `西南${form.corner_depth_sw}cm`,
        form.corner_depth_nw && `西北${form.corner_depth_nw}cm`,
      ].filter(Boolean).join('，');
      lines.push(`四角发掘深度：${corners}。`);

      if (form.layer_completed === '是') {
        lines.push(`${form.layer_number}层已发掘完毕。`);
        const summaryParts: string[] = [];
        summaryParts.push(`${form.layer_number}层水平分布于全方`);
        if (form.layer_thickness_for_summary) summaryParts.push(`厚${form.layer_thickness_for_summary}厘米`);
        if (soilDesc) summaryParts.push(`为${soilDesc}`);
        summaryParts.push(`较${densityStr === '疏松' ? '' : '为'}${densityStr}`);
        if (form.inclusions) summaryParts.push(`包含${form.inclusions}`);
        if (form.artifacts_found) summaryParts.push(`出土${form.artifacts_found}`);
        if (form.layer_nature) summaryParts.push(`应为${form.layer_nature}`);
        lines.push(`${form.layer_number}层小结：${summaryParts.join('，')}。`);
      }
      lines.push('');
    }

    // Section 2: 刮面
    if (form.has_scraping) {
      const secNum = form.has_layer_excavation ? '二' : '一';
      lines.push(`${secNum}、刮面`);
      lines.push(`对探方进行刮面（${form.scrape_progress}），方向${form.scrape_direction}。`);
      if (form.scrape_observation) {
        lines.push(`刮面后发现：${form.scrape_observation}`);
      } else {
        lines.push('刮面后未发现明显遗迹现象。');
      }
      lines.push('');
    }

    // Section 3: 遗迹发掘
    if (form.has_feature_excavation) {
      const prevSections = [form.has_layer_excavation, form.has_scraping].filter(Boolean).length;
      const secLabels = ['一', '二', '三', '四'];
      const secNum = secLabels[prevSections];
      lines.push(`${secNum}、遗迹发掘`);

      for (let fi = 0; fi < form.feature_panels.length; fi++) {
        const fp = form.feature_panels[fi];
        if (form.feature_panels.length > 1) {
          lines.push(`【遗迹${fi + 1}】${fp.feature_number}`);
        }

        lines.push(`今日开始对${fp.feature_number}进行发掘。${fp.feature_number}为${fp.feature_type}，开口于${fp.feature_opening}层下${fp.break_relation !== '无' ? `，${fp.break_relation}` : ''}。平面呈${fp.shape}，${fp.dimensions}。`);

        if (fp.complete_status === '全部清理完成') {
          lines.push(`采用${fp.excavate_method}进行发掘，解剖方向${fp.section_dir}。`);

          for (const fl of fp.feature_layers) {
            if (!fl.layer && !fl.texture && !fl.color && !fl.thickness && !fl.inclusions) continue;
            const flSoil = [fl.color, fl.texture].filter(Boolean).join('');
            const flParts = [flSoil, fl.inclusions].filter(Boolean);
            const flDesc = flParts.length > 0 ? flParts.join('，包含') : '';
            if (fl.thickness) {
              lines.push(`清理${fl.layer}层，深度${fl.thickness}厘米。堆积过筛，收集全部出土遗物。`);
            }
            if (flDesc) {
              lines.push(`${fl.layer}层堆积${flDesc}${fl.thickness ? `，厚${fl.thickness}厘米` : ''}。`);
            }
          }

          if (fp.soil_samples) lines.push(`土样采集：${fp.soil_samples}。`);
          if (fp.artifacts) lines.push(`出土遗物：${fp.artifacts}。`);

          lines.push(`至${form.diary_date}，${fp.feature_number}全部清理完毕。`);
          if (fp.has_photo === '是') lines.push(`${fp.photo_desc || '用相机对其进行拍照'}。`);
          if (fp.has_drawing === '是') lines.push(`${fp.drawing_desc || '现场绘制平、剖面图'}。`);

          // Feature summary
          lines.push('');
          lines.push(`${fp.feature_number}小结：`);
          lines.push(`位置与层位：${fp.feature_number}位于探方内，开口于${fp.feature_opening}层下${fp.break_relation !== '无' ? `，${fp.break_relation}` : ''}。`);
          lines.push(`形状与尺寸：平面呈${fp.shape}，${fp.dimensions}。`);

          const flSummaries: string[] = [];
          for (const fl of fp.feature_layers) {
            if (!fl.layer && !fl.texture && !fl.color && !fl.thickness && !fl.inclusions) continue;
            const flSoil = [fl.color, fl.texture].filter(Boolean).join('');
            const flParts = [flSoil, fl.inclusions].filter(Boolean);
            const flDesc = flParts.length > 0 ? flParts.join('，包含') : '';
            if (flDesc) flSummaries.push(`${fl.layer}层${flDesc}，厚${fl.thickness || '?'}厘米`);
          }
          if (flSummaries.length > 0) {
            lines.push(`堆积状况：坑内堆积${flSummaries.length}层。${flSummaries.join('；')}。`);
          }
          const collected: string[] = [];
          if (fp.artifacts) collected.push(`出土遗物${fp.artifacts}`);
          if (fp.soil_samples) collected.push(`土样${fp.soil_samples}`);
          if (collected.length > 0) lines.push(`采集情况：${collected.join('；')}。`);
        } else {
          // Partial completion
          lines.push(`采用${fp.excavate_method}进行发掘，解剖方向${fp.section_dir}。`);
          if (fp.excavate_depth) {
            lines.push(`当天清理深度${fp.excavate_depth}厘米。`);
          }
          if (fp.deposit_description) {
            lines.push(`当天清理堆积描述：${fp.deposit_description}`);
          }
          for (const fl of fp.feature_layers) {
            if (!fl.layer && !fl.texture && !fl.color && !fl.thickness && !fl.inclusions) continue;
            const flSoil = [fl.color, fl.texture].filter(Boolean).join('');
            const flParts = [flSoil, fl.inclusions].filter(Boolean);
            const flDesc = flParts.length > 0 ? flParts.join('，包含') : '';
            if (flDesc) lines.push(`${fl.layer}层${flDesc}${fl.thickness ? `，厚${fl.thickness}厘米` : ''}。`);
          }
          if (fp.soil_samples) lines.push(`土样采集：${fp.soil_samples}。`);
          if (fp.artifacts) lines.push(`出土遗物：${fp.artifacts}。`);
          lines.push(`${fp.feature_number}${fp.complete_status}。`);
        }
        lines.push('');
      }
    }

    // Summary section
    const prevSections = [form.has_layer_excavation, form.has_scraping, form.has_feature_excavation].filter(Boolean).length;
    const secLabels = ['一', '二', '三', '四'];
    const sumNum = secLabels[prevSections];
    lines.push(`${sumNum}、总结与计划`);
    if (form.work_summary) lines.push(`工作总结与反思：${form.work_summary}`);
    if (form.tomorrow_plan) lines.push(`明日计划：${form.tomorrow_plan}`);

    if (form.specimen_register) {
      lines.push(`当天采集标本：${form.specimen_register}`);
    }
    if (form.small_finds_register) {
      lines.push(`当天出土小件登记：${form.small_finds_register}`);
    }

    lines.push('');
    lines.push(`记录人：${form.recorder}`);

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
        wind_direction: form.wind_direction,
        humidity: form.humidity,
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
      setCopyMsg('已复制');
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

  const inputClass = 'w-full px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white';
  const labelClass = 'block text-xs font-medium text-stone-600 mb-1';
  const sectionClass = 'bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden';
  const requiredMark = <span className="text-red-500 ml-0.5">*</span>;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">
      <h2 className="text-2xl font-bold text-stone-800">考古日记生成</h2>

      {/* Section 1: 基本信息 */}
      <div className={sectionClass}>
        <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">📋 基本信息</div>
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>日期{requiredMark}</label>
            <input type="date" value={form.diary_date} onChange={e => updateForm('diary_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>天气{requiredMark}</label>
            <select value={form.weather} onChange={e => updateForm('weather', e.target.value)} className={inputClass}>
              <option>晴</option><option>阴</option><option>雨</option><option>多云</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>风向{requiredMark}</label>
            <input value={form.wind_direction} onChange={e => updateForm('wind_direction', e.target.value)} className={inputClass} placeholder="如 北风、东南风" />
          </div>
          <div>
            <label className={labelClass}>湿度{requiredMark}</label>
            <input value={form.humidity} onChange={e => updateForm('humidity', e.target.value)} className={inputClass} placeholder="如 65%" />
          </div>
          <div>
            <label className={labelClass}>探方编号{requiredMark}</label>
            <input value={form.trench_number} onChange={e => updateForm('trench_number', e.target.value)} className={inputClass} placeholder="T0101" />
          </div>
          <div>
            <label className={labelClass}>记录人{requiredMark}</label>
            <input value={form.recorder} onChange={e => updateForm('recorder', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Work type selection */}
      <div className={sectionClass}>
        <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">📌 当天工作内容（至少选一项）</div>
        <div className="px-5 py-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.has_layer_excavation} onChange={e => updateForm('has_layer_excavation', e.target.checked)} className="accent-amber-700" />
            地层发掘
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.has_scraping} onChange={e => updateForm('has_scraping', e.target.checked)} className="accent-amber-700" />
            刮面
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.has_feature_excavation} onChange={e => updateForm('has_feature_excavation', e.target.checked)} className="accent-amber-700" />
            遗迹发掘
          </label>
        </div>
      </div>

      {/* Section 2: 地层发掘 */}
      {form.has_layer_excavation && (
        <div className={sectionClass}>
          <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">🔍 地层发掘</div>
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>层位编号{requiredMark}</label>
                <input value={form.layer_number} onChange={e => updateForm('layer_number', e.target.value)} className={inputClass} placeholder="①" />
              </div>
              <div>
                <label className={labelClass}>发掘方向{requiredMark}</label>
                <input value={form.excavate_direction} onChange={e => updateForm('excavate_direction', e.target.value)} className={inputClass} placeholder="从北向南" />
              </div>
              <div>
                <label className={labelClass}>工作进度{requiredMark}</label>
                <input value={form.work_progress} onChange={e => updateForm('work_progress', e.target.value)} className={inputClass} placeholder="完成北部二分之一" />
              </div>
              <div>
                <label className={labelClass}>发掘方法</label>
                <input value={form.excavate_method} onChange={e => updateForm('excavate_method', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>开始时间{requiredMark}</label>
                <input type="time" value={form.excavate_time_start} onChange={e => updateForm('excavate_time_start', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>结束时间{requiredMark}</label>
                <input type="time" value={form.excavate_time_end} onChange={e => updateForm('excavate_time_end', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>使用工具</label>
                <input value={form.excavate_tool} onChange={e => updateForm('excavate_tool', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>是否过筛</label>
                <select value={form.use_sieve} onChange={e => updateForm('use_sieve', e.target.value)} className={inputClass}>
                  <option>否</option><option>是</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>土色{requiredMark}</label>
                <input value={form.soil_color} onChange={e => updateForm('soil_color', e.target.value)} className={inputClass} placeholder="浅褐色" />
              </div>
              <div>
                <label className={labelClass}>土质{requiredMark}</label>
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
                <label className={labelClass}>出土物</label>
                <input value={form.artifacts_found} onChange={e => updateForm('artifacts_found', e.target.value)} className={inputClass} placeholder="陶片1袋" />
              </div>
            </div>

            <div>
              <label className={labelClass}>是否发现特殊遗迹现象</label>
              <select value={form.has_special_feature} onChange={e => updateForm('has_special_feature', e.target.value)} className={`${inputClass} w-24`}>
                <option>否</option><option>是</option>
              </select>
              {form.has_special_feature === '是' && (
                <textarea value={form.special_feature_desc} onChange={e => updateForm('special_feature_desc', e.target.value)} className={`${inputClass} mt-2`} rows={2}
                  placeholder="请描述发现的特殊遗迹现象…" />
              )}
            </div>

            <div>
              <label className={labelClass}>四角发掘深度（cm）{requiredMark}</label>
              <div className="grid grid-cols-4 gap-2">
                <input value={form.corner_depth_ne} onChange={e => updateForm('corner_depth_ne', e.target.value)} className={inputClass} placeholder="东北" />
                <input value={form.corner_depth_se} onChange={e => updateForm('corner_depth_se', e.target.value)} className={inputClass} placeholder="东南" />
                <input value={form.corner_depth_sw} onChange={e => updateForm('corner_depth_sw', e.target.value)} className={inputClass} placeholder="西南" />
                <input value={form.corner_depth_nw} onChange={e => updateForm('corner_depth_nw', e.target.value)} className={inputClass} placeholder="西北" />
              </div>
            </div>

            <div>
              <label className={labelClass}>该层是否已发掘完毕</label>
              <select value={form.layer_completed} onChange={e => updateForm('layer_completed', e.target.value)} className={`${inputClass} w-24`}>
                <option>否</option><option>是</option>
              </select>
              {form.layer_completed === '是' && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className={labelClass}>地层厚度（cm）</label>
                    <input type="number" value={form.layer_thickness_for_summary} onChange={e => updateForm('layer_thickness_for_summary', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>地层性质判断</label>
                    <input value={form.layer_nature} onChange={e => updateForm('layer_nature', e.target.value)} className={inputClass} placeholder="现代耕土层、明清文化层" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section: 刮面 */}
      {form.has_scraping && (
        <div className={sectionClass}>
          <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">🔲 刮面</div>
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>工作进度</label>
                <select value={form.scrape_progress} onChange={e => updateForm('scrape_progress', e.target.value)} className={inputClass}>
                  <option>全方一次</option><option>全方两次</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>方向{requiredMark}</label>
                <input value={form.scrape_direction} onChange={e => updateForm('scrape_direction', e.target.value)} className={inputClass} placeholder="从北向南" />
              </div>
            </div>
            <div>
              <label className={labelClass}>刮面后发现现象描述</label>
              <textarea value={form.scrape_observation} onChange={e => updateForm('scrape_observation', e.target.value)} className={inputClass} rows={2}
                placeholder="描述刮面后发现的遗迹现象…" />
            </div>
          </div>
        </div>
      )}

      {/* Section: 遗迹发掘 */}
      {form.has_feature_excavation && (
        <div className="space-y-4">
          {form.feature_panels.map((fp, fi) => (
            <div key={fi} className={sectionClass}>
              <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">🏺 遗迹发掘 {form.feature_panels.length > 1 ? `(${fi + 1})` : ''}</span>
                {form.feature_panels.length > 1 && (
                  <button type="button" onClick={() => removeFeaturePanel(fi)} className="text-xs text-red-500 hover:text-red-700">删除此遗迹</button>
                )}
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>遗迹编号{requiredMark}</label>
                    <input value={fp.feature_number} onChange={e => updateFeature(fi, 'feature_number', e.target.value)} className={inputClass} placeholder="2024HSCH100" />
                  </div>
                  <div>
                    <label className={labelClass}>遗迹类型{requiredMark}</label>
                    <select value={fp.feature_type} onChange={e => updateFeature(fi, 'feature_type', e.target.value)} className={inputClass}>
                      <option>灰坑</option><option>灰沟</option><option>房址</option><option>墓葬</option><option>其他</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>开口层位{requiredMark}</label>
                    <input value={fp.feature_opening} onChange={e => updateFeature(fi, 'feature_opening', e.target.value)} className={inputClass} placeholder="②层下" />
                  </div>
                  <div>
                    <label className={labelClass}>打破关系{requiredMark}</label>
                    <input value={fp.break_relation} onChange={e => updateFeature(fi, 'break_relation', e.target.value)} className={inputClass} placeholder="打破位于其北侧的沟状遗迹（如无可填无）" />
                  </div>
                  <div>
                    <label className={labelClass}>平面形状{requiredMark}</label>
                    <select value={fp.shape} onChange={e => updateFeature(fi, 'shape', e.target.value)} className={inputClass}>
                      <option>圆形</option><option>长方形</option><option>不规则形</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>尺寸{requiredMark}</label>
                    <input value={fp.dimensions} onChange={e => updateFeature(fi, 'dimensions', e.target.value)} className={inputClass} placeholder="直径80~85厘米" />
                  </div>
                  <div>
                    <label className={labelClass}>发掘方法{requiredMark}</label>
                    <select value={fp.excavate_method} onChange={e => updateFeature(fi, 'excavate_method', e.target.value)} className={inputClass}>
                      <option>1/2发掘法</option><option>全面发掘</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>解剖方向{requiredMark}</label>
                    <input value={fp.section_dir} onChange={e => updateFeature(fi, 'section_dir', e.target.value)} className={inputClass} placeholder="正南北" />
                  </div>
                  <div>
                    <label className={labelClass}>完工状态{requiredMark}</label>
                    <select value={fp.complete_status} onChange={e => updateFeature(fi, 'complete_status', e.target.value)} className={inputClass}>
                      <option>二分之一完成</option><option>二分之一未完成</option><option>全部清理完成</option>
                    </select>
                  </div>
                </div>

                {/* Conditional fields based on complete_status */}
                {fp.complete_status !== '全部清理完成' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>当天清理深度（cm）</label>
                      <input type="number" value={fp.excavate_depth} onChange={e => updateFeature(fi, 'excavate_depth', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>当天清理堆积描述</label>
                      <input value={fp.deposit_description} onChange={e => updateFeature(fi, 'deposit_description', e.target.value)} className={inputClass} placeholder="土质土色、包含物等" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Full completion: show layer deposits for summary */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={labelClass}>堆积描述</label>
                        <button type="button" onClick={() => addFeatureLayer(fi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加层</button>
                      </div>
                      {fp.feature_layers.map((fl, li) => (
                        <div key={li} className="grid grid-cols-5 gap-2 mb-2">
                          <input value={fl.layer} onChange={e => updateFeatureLayer(fi, li, 'layer', e.target.value)} className={inputClass} placeholder="层号" />
                          <input value={fl.texture} onChange={e => updateFeatureLayer(fi, li, 'texture', e.target.value)} className={inputClass} placeholder="土质" />
                          <input value={fl.color} onChange={e => updateFeatureLayer(fi, li, 'color', e.target.value)} className={inputClass} placeholder="土色" />
                          <input value={fl.thickness} onChange={e => updateFeatureLayer(fi, li, 'thickness', e.target.value)} className={inputClass} placeholder="厚度cm" />
                          <div className="flex gap-1">
                            <input value={fl.inclusions} onChange={e => updateFeatureLayer(fi, li, 'inclusions', e.target.value)} className={inputClass} placeholder="包含物" />
                            {fp.feature_layers.length > 1 && (
                              <button type="button" onClick={() => removeFeatureLayer(fi, li)} className="text-red-500 text-xs shrink-0">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>土样采集</label>
                        <input value={fp.soil_samples} onChange={e => updateFeature(fi, 'soil_samples', e.target.value)} className={inputClass} placeholder="①层浮选土样1份" />
                      </div>
                      <div>
                        <label className={labelClass}>出土遗物</label>
                        <input value={fp.artifacts} onChange={e => updateFeature(fi, 'artifacts', e.target.value)} className={inputClass} placeholder="①层陶片2袋" />
                      </div>
                      <div>
                        <label className={labelClass}>拍照</label>
                        <select value={fp.has_photo} onChange={e => updateFeature(fi, 'has_photo', e.target.value)} className={inputClass}>
                          <option>是</option><option>否</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>绘图</label>
                        <select value={fp.has_drawing} onChange={e => updateFeature(fi, 'has_drawing', e.target.value)} className={inputClass}>
                          <option>是</option><option>否</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          <button type="button" onClick={addFeaturePanel}
            className="w-full py-2 border-2 border-dashed border-stone-300 rounded-xl text-sm text-stone-500 hover:border-amber-400 hover:text-amber-700 transition-colors">
            + 添加另一个遗迹
          </button>
        </div>
      )}

      {/* Section: 总结与计划 */}
      <div className={sectionClass}>
        <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">📝 总结、计划与采集登记</div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className={labelClass}>工作总结与反思</label>
            <textarea value={form.work_summary} onChange={e => updateForm('work_summary', e.target.value)} className={inputClass} rows={3}
              placeholder="本日工作内容总结与反思…" />
          </div>
          <div>
            <label className={labelClass}>明日计划</label>
            <textarea value={form.tomorrow_plan} onChange={e => updateForm('tomorrow_plan', e.target.value)} className={inputClass} rows={2}
              placeholder="明日工作计划…" />
          </div>
          <div>
            <label className={labelClass}>当天采集标本登记（土样、陶片、骨骼、炭样等）</label>
            <textarea value={form.specimen_register} onChange={e => updateForm('specimen_register', e.target.value)} className={inputClass} rows={2}
              placeholder="如：①层浮选土样1份、陶片1袋…" />
          </div>
          <div>
            <label className={labelClass}>当天出土小件登记</label>
            <textarea value={form.small_finds_register} onChange={e => updateForm('small_finds_register', e.target.value)} className={inputClass} rows={2}
              placeholder="描述出土小件编号、形制、坐标等…" />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={generateDiary}
          className="bg-amber-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors">
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
                    {d.content.slice(0, 100)}…
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
