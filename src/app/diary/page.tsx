'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Types
interface DiaryRecord {
  id: number; diary_date: string; weather: string; wind_direction: string;
  humidity: string; trench_number: string; recorder: string; content: string; created_at: string;
}

interface InclusionRow {
  type: string; proportion: string; particleSize: string; sorting: string; roundness: string;
}

interface ArtifactRow {
  type: string; quantity: string; number: string;
}

interface SpecimenRow {
  number: string; category: string; quantity: string;
}

interface SmallFindRow {
  number: string; category: string; coordinate: string; location: string;
}

interface LayerPanel {
  layer_number: string; excavate_direction: string; work_progress: string;
  excavate_time_start: string; excavate_time_end: string;
  excavate_method: string; excavate_tool: string; use_sieve: string;
  soil_texture: string; soil_color: string; soil_density: string;
  inclusions: InclusionRow[]; artifacts_found: ArtifactRow[];
  specimens: SpecimenRow[];
  has_special_feature: string; special_feature_desc: string;
  corner_depth_ne: string; corner_depth_se: string; corner_depth_sw: string; corner_depth_nw: string;
  layer_completed: string; layer_thickness: string;
  upper_interface_shape: string; lower_interface_shape: string; layer_nature: string;
  has_small_find: string; small_finds: SmallFindRow[];
}

interface HalfDeposit {
  layer: string;
  soil_texture: string; soil_color: string; soil_density: string;
  thickness: string;
  upper_interface: string; lower_interface: string;
  inclusions: InclusionRow[];
  artifacts_found: ArtifactRow[];
  specimens: SpecimenRow[];
  soil_sample: string;
}

interface CompleteDepositLayer {
  layer: string; texture: string; color: string; density: string; thickness: string;
  upper_interface: string; lower_interface: string;
  inclusions: InclusionRow[];
  artifacts_found: ArtifactRow[];
  specimens: SpecimenRow[];
  soil_sample: string;
  observation: string;
}

interface FeaturePanel {
  feature_number: string; feature_type: string; feature_opening: string;
  break_relation: string; shape: string; dimensions: string;
  excavate_method: string; section_dir: string; complete_status: string;
  half_deposits: HalfDeposit[];
  special_observation: string;
  mouth_clarity: string; profile_wall: string; profile_bottom: string;
  wall_desc: string; bottom_clarity: string; bottom_desc: string;
  posthole_angle: string; posthole_direction: string;
  complete_deposits: CompleteDepositLayer[];
  stratigraphy_diagram: string;
  has_small_find: string; small_finds: SmallFindRow[];
}

// Defaults
const emptyInclusion = (): InclusionRow => ({ type: '', proportion: '', particleSize: '', sorting: '一般', roundness: '略有棱角的' });
const emptyArtifact = (): ArtifactRow => ({ type: '', quantity: '', number: '' });
const emptySpecimen = (): SpecimenRow => ({ number: '', category: '', quantity: '' });
const emptySmallFind = (): SmallFindRow => ({ number: '', category: '', coordinate: '', location: '' });

const emptyLayerPanel = (): LayerPanel => ({
  layer_number: '①', excavate_direction: '', work_progress: '',
  excavate_time_start: '', excavate_time_end: '',
  excavate_method: '水平发掘法', excavate_tool: '铁锹', use_sieve: '否',
  soil_texture: '', soil_color: '', soil_density: '较疏松',
  inclusions: [emptyInclusion()], artifacts_found: [emptyArtifact()],
  specimens: [emptySpecimen()],
  has_special_feature: '否', special_feature_desc: '',
  corner_depth_ne: '', corner_depth_se: '', corner_depth_sw: '', corner_depth_nw: '',
  layer_completed: '否', layer_thickness: '',
  upper_interface_shape: '水平状', lower_interface_shape: '水平状', layer_nature: '',
  has_small_find: '否', small_finds: [emptySmallFind()],
});

const emptyHalfDeposit = (): HalfDeposit => ({
  layer: '', soil_texture: '', soil_color: '', soil_density: '较疏松',
  thickness: '', upper_interface: '水平状', lower_interface: '水平状',
  inclusions: [emptyInclusion()], artifacts_found: [emptyArtifact()],
  specimens: [emptySpecimen()], soil_sample: '',
});

const emptyCompleteDeposit = (): CompleteDepositLayer => ({
  layer: '', texture: '', color: '', density: '较疏松', thickness: '',
  upper_interface: '水平状', lower_interface: '水平状',
  inclusions: [emptyInclusion()], artifacts_found: [emptyArtifact()],
  specimens: [emptySpecimen()], soil_sample: '', observation: '',
});

const emptyFeature = (): FeaturePanel => ({
  feature_number: '', feature_type: '灰坑', feature_opening: '',
  break_relation: '', shape: '圆形', dimensions: '',
  excavate_method: '1/2发掘法', section_dir: '', complete_status: '二分之一完成',
  half_deposits: [emptyHalfDeposit()], special_observation: '',
  mouth_clarity: '明显', profile_wall: '筒形', profile_bottom: '平底',
  wall_desc: '', bottom_clarity: '明显', bottom_desc: '',
  posthole_angle: '', posthole_direction: '',
  complete_deposits: [emptyCompleteDeposit()], stratigraphy_diagram: '',
  has_small_find: '否', small_finds: [emptySmallFind()],
});

const today = () => new Date().toISOString().slice(0, 10);

const defaultForm = {
  diary_date: today(),
  weather: '晴', wind_direction: '', humidity: '',
  trench_number: '', recorder: '',
  work_type: 'excavation' as 'excavation' | 'rest',
  has_layer_excavation: true, has_scraping: false, has_feature_excavation: false,
  layer_panels: [emptyLayerPanel()],
  scrape_progress: '全方一次', scrape_direction: '', scrape_observation: '',
  scrape_time_start: '', scrape_time_end: '',
  feature_panels: [emptyFeature()],
  work_summary: '', tomorrow_plan: '',
  specimen_register: '', small_finds_register: '',
};

// ============ Component ============
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
  const [p, setP] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const u = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  // Layer panel helpers
  const ul = (i: number, key: string, val: unknown) => setForm(f => {
    const lp = [...f.layer_panels]; lp[i] = { ...lp[i], [key]: val }; return { ...f, layer_panels: lp };
  });
  const ulInc = (pi: number, ri: number, key: string, val: string) => setForm(f => {
    const lp = [...f.layer_panels];
    const incs = [...lp[pi].inclusions]; incs[ri] = { ...incs[ri], [key]: val };
    lp[pi] = { ...lp[pi], inclusions: incs }; return { ...f, layer_panels: lp };
  });
  const ulArt = (pi: number, ri: number, key: string, val: string) => setForm(f => {
    const lp = [...f.layer_panels];
    const arts = [...lp[pi].artifacts_found]; arts[ri] = { ...arts[ri], [key]: val };
    lp[pi] = { ...lp[pi], artifacts_found: arts }; return { ...f, layer_panels: lp };
  });
  const ulSpec = (pi: number, ri: number, key: string, val: string) => setForm(f => {
    const lp = [...f.layer_panels];
    const sp = [...lp[pi].specimens]; sp[ri] = { ...sp[ri], [key]: val };
    lp[pi] = { ...lp[pi], specimens: sp }; return { ...f, layer_panels: lp };
  });
  const ulSF = (pi: number, ri: number, key: string, val: string) => setForm(f => {
    const lp = [...f.layer_panels];
    const sf = [...lp[pi].small_finds]; sf[ri] = { ...sf[ri], [key]: val };
    lp[pi] = { ...lp[pi], small_finds: sf }; return { ...f, layer_panels: lp };
  });
  const addLayer = () => setForm(f => ({ ...f, layer_panels: [...f.layer_panels, emptyLayerPanel()] }));
  const delLayer = (i: number) => setForm(f => ({ ...f, layer_panels: f.layer_panels.filter((_, idx) => idx !== i) }));
  const addLayerInc = (pi: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], inclusions: [...lp[pi].inclusions, emptyInclusion()] };
    return { ...f, layer_panels: lp };
  });
  const delLayerInc = (pi: number, ri: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], inclusions: lp[pi].inclusions.filter((_, i) => i !== ri) };
    return { ...f, layer_panels: lp };
  });
  const addLayerArt = (pi: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], artifacts_found: [...lp[pi].artifacts_found, emptyArtifact()] };
    return { ...f, layer_panels: lp };
  });
  const delLayerArt = (pi: number, ri: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], artifacts_found: lp[pi].artifacts_found.filter((_, i) => i !== ri) };
    return { ...f, layer_panels: lp };
  });
  const addLayerSpec = (pi: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], specimens: [...lp[pi].specimens, emptySpecimen()] };
    return { ...f, layer_panels: lp };
  });
  const delLayerSpec = (pi: number, ri: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], specimens: lp[pi].specimens.filter((_, i) => i !== ri) };
    return { ...f, layer_panels: lp };
  });
  const addLayerSF = (pi: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], small_finds: [...lp[pi].small_finds, emptySmallFind()] };
    return { ...f, layer_panels: lp };
  });
  const delLayerSF = (pi: number, ri: number) => setForm(f => {
    const lp = [...f.layer_panels]; lp[pi] = { ...lp[pi], small_finds: lp[pi].small_finds.filter((_, i) => i !== ri) };
    return { ...f, layer_panels: lp };
  });

  // Feature panel helpers
  const uf = (i: number, key: string, val: unknown) => setForm(f => {
    const fp = [...f.feature_panels]; fp[i] = { ...fp[i], [key]: val }; return { ...f, feature_panels: fp };
  });
  const addFeature = () => setForm(f => ({ ...f, feature_panels: [...f.feature_panels, emptyFeature()] }));
  const delFeature = (i: number) => setForm(f => ({ ...f, feature_panels: f.feature_panels.filter((_, idx) => idx !== i) }));

  // Feature small finds
  const ufSF = (fi: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const sf = [...fp[fi].small_finds]; sf[ri] = { ...sf[ri], [key]: val };
    fp[fi] = { ...fp[fi], small_finds: sf }; return { ...f, feature_panels: fp };
  });
  const addFeatSF = (fi: number) => setForm(f => {
    const fp = [...f.feature_panels]; fp[fi] = { ...fp[fi], small_finds: [...fp[fi].small_finds, emptySmallFind()] };
    return { ...f, feature_panels: fp };
  });
  const delFeatSF = (fi: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels]; fp[fi] = { ...fp[fi], small_finds: fp[fi].small_finds.filter((_, i) => i !== ri) };
    return { ...f, feature_panels: fp };
  });

  // Half deposit helpers
  const uhd = (fi: number, di: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], [key]: val };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const addHalfDep = (fi: number) => setForm(f => {
    const fp = [...f.feature_panels]; fp[fi] = { ...fp[fi], half_deposits: [...fp[fi].half_deposits, emptyHalfDeposit()] };
    return { ...f, feature_panels: fp };
  });
  const delHalfDep = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels]; fp[fi] = { ...fp[fi], half_deposits: fp[fi].half_deposits.filter((_, i) => i !== di) };
    return { ...f, feature_panels: fp };
  });
  // Half deposit inclusions
  const uhdInc = (fi: number, di: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits];
    const incs = [...hd[di].inclusions]; incs[ri] = { ...incs[ri], [key]: val };
    hd[di] = { ...hd[di], inclusions: incs };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const addHdInc = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], inclusions: [...hd[di].inclusions, emptyInclusion()] };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const delHdInc = (fi: number, di: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], inclusions: hd[di].inclusions.filter((_, i) => i !== ri) };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  // Half deposit artifacts
  const uhdArt = (fi: number, di: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits];
    const arts = [...hd[di].artifacts_found]; arts[ri] = { ...arts[ri], [key]: val };
    hd[di] = { ...hd[di], artifacts_found: arts };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const addHdArt = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], artifacts_found: [...hd[di].artifacts_found, emptyArtifact()] };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const delHdArt = (fi: number, di: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], artifacts_found: hd[di].artifacts_found.filter((_, i) => i !== ri) };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  // Half deposit specimens
  const uhdSpec = (fi: number, di: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits];
    const sp = [...hd[di].specimens]; sp[ri] = { ...sp[ri], [key]: val };
    hd[di] = { ...hd[di], specimens: sp };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const addHdSpec = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], specimens: [...hd[di].specimens, emptySpecimen()] };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });
  const delHdSpec = (fi: number, di: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const hd = [...fp[fi].half_deposits]; hd[di] = { ...hd[di], specimens: hd[di].specimens.filter((_, i) => i !== ri) };
    fp[fi] = { ...fp[fi], half_deposits: hd }; return { ...f, feature_panels: fp };
  });

  // Complete deposit helpers
  const ucd = (fi: number, di: number, key: string, val: unknown) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], [key]: val };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const ucdInc = (fi: number, di: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits];
    const incs = [...cd[di].inclusions]; incs[ri] = { ...incs[ri], [key]: val };
    cd[di] = { ...cd[di], inclusions: incs };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const addCompDep = (fi: number) => setForm(f => {
    const fp = [...f.feature_panels]; fp[fi] = { ...fp[fi], complete_deposits: [...fp[fi].complete_deposits, emptyCompleteDeposit()] };
    return { ...f, feature_panels: fp };
  });
  const delCompDep = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels]; fp[fi] = { ...fp[fi], complete_deposits: fp[fi].complete_deposits.filter((_, i) => i !== di) };
    return { ...f, feature_panels: fp };
  });
  const addCompInc = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], inclusions: [...cd[di].inclusions, emptyInclusion()] };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const delCompInc = (fi: number, di: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], inclusions: cd[di].inclusions.filter((_, i) => i !== ri) };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  // Complete deposit artifacts
  const ucdArt = (fi: number, di: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits];
    const arts = [...cd[di].artifacts_found]; arts[ri] = { ...arts[ri], [key]: val };
    cd[di] = { ...cd[di], artifacts_found: arts };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const addCdArt = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], artifacts_found: [...cd[di].artifacts_found, emptyArtifact()] };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const delCdArt = (fi: number, di: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], artifacts_found: cd[di].artifacts_found.filter((_, i) => i !== ri) };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  // Complete deposit specimens
  const ucdSpec = (fi: number, di: number, ri: number, key: string, val: string) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits];
    const sp = [...cd[di].specimens]; sp[ri] = { ...sp[ri], [key]: val };
    cd[di] = { ...cd[di], specimens: sp };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const addCdSpec = (fi: number, di: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], specimens: [...cd[di].specimens, emptySpecimen()] };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });
  const delCdSpec = (fi: number, di: number, ri: number) => setForm(f => {
    const fp = [...f.feature_panels];
    const cd = [...fp[fi].complete_deposits]; cd[di] = { ...cd[di], specimens: cd[di].specimens.filter((_, i) => i !== ri) };
    fp[fi] = { ...fp[fi], complete_deposits: cd }; return { ...f, feature_panels: fp };
  });

  // File upload for diagram
  const handleDiagramUpload = async (fi: number, file: File) => {
    const key = `diagram-${fi}`;
    setUploading(prev => ({ ...prev, [key]: true }));
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.path) uf(fi, 'stratigraphy_diagram', data.path);
    else alert(data.error || '上传失败');
    setUploading(prev => ({ ...prev, [key]: false }));
  };

  // Validation
  const validate = (): string | null => {
    if (!form.diary_date) return '请填写日期';
    if (!form.weather) return '请填写天气';
    if (!form.wind_direction) return '请填写风向';
    if (!form.humidity) return '请填写湿度';
    if (!form.trench_number) return '请填写探方编号';
    if (!form.recorder) return '请填写记录人';
    if (form.work_type === 'rest') return null;

    const anyWork = form.has_layer_excavation || form.has_scraping || form.has_feature_excavation;
    if (!anyWork) return '地层发掘、刮面、遗迹发掘中至少选择一项';

    if (form.has_layer_excavation) {
      for (let i = 0; i < form.layer_panels.length; i++) {
        const lp = form.layer_panels[i]; const n = form.layer_panels.length > 1 ? `地层${i + 1}：` : '';
        if (!lp.layer_number) return `${n}请填写层位编号`;
        if (!lp.excavate_direction) return `${n}请填写发掘方向`;
        if (!lp.work_progress) return `${n}请填写工作进度`;
        if (!lp.excavate_time_start) return `${n}请填写开始时间`;
        if (!lp.excavate_time_end) return `${n}请填写结束时间`;
        if (!lp.excavate_method) return `${n}请填写发掘方法`;
        if (!lp.excavate_tool) return `${n}请填写使用工具`;
        if (!lp.use_sieve) return `${n}请选择是否过筛`;
        if (!lp.soil_texture) return `${n}请填写土质`;
        if (!lp.soil_color) return `${n}请填写土色`;
        if (!lp.soil_density) return `${n}请选择致密度`;
        for (let j = 0; j < lp.inclusions.length; j++) {
          const inc = lp.inclusions[j];
          if (!inc.type || !inc.proportion || !inc.particleSize) return `${n}包含物${j + 1}：请完整填写种类、比例、粒径`;
        }
        for (let j = 0; j < lp.artifacts_found.length; j++) {
          const art = lp.artifacts_found[j];
          if (!art.type || !art.quantity || !art.number) return `${n}出土物${j + 1}：请完整填写种类、数量、编号`;
        }
        for (let j = 0; j < lp.specimens.length; j++) {
          const sp = lp.specimens[j];
          if (!sp.number || !sp.category || !sp.quantity) return `${n}标本${j + 1}：请完整填写编号、类别、数量`;
        }
        if (!lp.corner_depth_ne && !lp.corner_depth_se && !lp.corner_depth_sw && !lp.corner_depth_nw) return `${n}请填写四角发掘深度`;
        if (lp.has_special_feature === '是' && !lp.special_feature_desc) return `${n}请描述特殊遗迹现象`;
        if (lp.layer_completed === '是') {
          if (!lp.layer_thickness) return `${n}请填写地层厚度`;
          if (!lp.upper_interface_shape) return `${n}请选择堆积上界面形状`;
          if (!lp.lower_interface_shape) return `${n}请选择堆积下界面形状`;
        }
        if (lp.has_small_find === '是') {
          for (let j = 0; j < lp.small_finds.length; j++) {
            const sf = lp.small_finds[j];
            if (!sf.number || !sf.category || !sf.coordinate || !sf.location) return `${n}小件${j + 1}：请完整填写编号、类别、坐标、入库位置`;
          }
        }
      }
    }

    if (form.has_scraping) {
      if (!form.scrape_time_start) return '刮面：请填写开始时间';
      if (!form.scrape_time_end) return '刮面：请填写结束时间';
      if (!form.scrape_progress) return '刮面：请选择工作进度';
      if (!form.scrape_direction) return '刮面：请填写方向';
      if (!form.scrape_observation) return '刮面：请填写发现现象描述';
    }

    if (form.has_feature_excavation) {
      for (let i = 0; i < form.feature_panels.length; i++) {
        const fp = form.feature_panels[i]; const n = form.feature_panels.length > 1 ? `遗迹${i + 1}：` : '';
        if (!fp.feature_number) return `${n}请填写遗迹编号`;
        if (!fp.feature_type) return `${n}请选择遗迹类型`;
        if (!fp.feature_opening) return `${n}请填写开口层位`;
        if (!fp.break_relation) return `${n}请填写打破关系`;
        if (!fp.shape) return `${n}请选择平面形状`;
        if (!fp.dimensions) return `${n}请填写尺寸`;
        if (!fp.excavate_method) return `${n}请选择发掘方法`;
        if (!fp.section_dir) return `${n}请填写解剖方向`;
        if (!fp.complete_status) return `${n}请选择完工状态`;

        if (fp.complete_status !== '全部清理完成') {
          for (let j = 0; j < fp.half_deposits.length; j++) {
            const hd = fp.half_deposits[j]; const dn = fp.half_deposits.length > 1 ? `堆积${j + 1}：` : '';
            if (!hd.layer) return `${n}${dn}请填写层位`;
            if (!hd.soil_texture) return `${n}${dn}请填写土质`;
            if (!hd.soil_color) return `${n}${dn}请填写土色`;
            if (!hd.soil_density) return `${n}${dn}请选择致密度`;
            for (let k = 0; k < hd.inclusions.length; k++) {
              const inc = hd.inclusions[k];
              if (!inc.type || !inc.proportion || !inc.particleSize) return `${n}${dn}包含物${k + 1}：请完整填写`;
            }
            for (let k = 0; k < hd.artifacts_found.length; k++) {
              const art = hd.artifacts_found[k];
              if (!art.type || !art.quantity || !art.number) return `${n}${dn}出土物${k + 1}：请完整填写`;
            }
            for (let k = 0; k < hd.specimens.length; k++) {
              const sp = hd.specimens[k];
              if (!sp.number || !sp.category || !sp.quantity) return `${n}${dn}标本${k + 1}：请完整填写`;
            }
          }
        } else {
          if (!fp.mouth_clarity) return `${n}请选择口部`;
          if (!fp.profile_wall) return `${n}请选择剖面壁部`;
          if (!fp.profile_bottom) return `${n}请选择剖面底部`;
          if (!fp.wall_desc) return `${n}请填写壁面描述`;
          if (!fp.bottom_clarity) return `${n}请选择底部`;
          if (!fp.bottom_desc) return `${n}请填写底面描述`;
          for (let j = 0; j < fp.complete_deposits.length; j++) {
            const cd = fp.complete_deposits[j]; const dn = fp.complete_deposits.length > 1 ? `堆积${j + 1}：` : '';
            if (!cd.layer) return `${n}${dn}请填写层位`;
            if (!cd.texture) return `${n}${dn}请填写土质`;
            if (!cd.color) return `${n}${dn}请填写土色`;
            if (!cd.density) return `${n}${dn}请选择致密度`;
            for (let k = 0; k < cd.inclusions.length; k++) {
              const inc = cd.inclusions[k];
              if (!inc.type || !inc.proportion || !inc.particleSize) return `${n}${dn}包含物${k + 1}：请完整填写`;
            }
            for (let k = 0; k < cd.artifacts_found.length; k++) {
              const art = cd.artifacts_found[k];
              if (!art.type || !art.quantity || !art.number) return `${n}${dn}出土物${k + 1}：请完整填写`;
            }
            for (let k = 0; k < cd.specimens.length; k++) {
              const sp = cd.specimens[k];
              if (!sp.number || !sp.category || !sp.quantity) return `${n}${dn}标本${k + 1}：请完整填写`;
            }
          }
        }
        if (fp.has_small_find === '是') {
          for (let j = 0; j < fp.small_finds.length; j++) {
            const sf = fp.small_finds[j];
            if (!sf.number || !sf.category || !sf.coordinate || !sf.location) return `${n}小件${j + 1}：请完整填写编号、类别、坐标、入库位置`;
          }
        }
      }
    }

    if (!form.work_summary) return '请填写工作总结与反思';
    if (!form.tomorrow_plan) return '请填写明日计划';
    return null;
  };

  // Collect specimens for auto-summary
  const collectSpecimens = () => {
    const parts: string[] = [];
    if (form.has_layer_excavation) {
      form.layer_panels.forEach((lp, i) => {
        const label = form.layer_panels.length > 1 ? `${lp.layer_number}层` : '';
        lp.specimens.filter(s => s.number).forEach(s => {
          parts.push(`${label}标本${s.number}（${s.category}，${s.quantity}）`);
        });
        lp.artifacts_found.filter(a => a.number).forEach(a => {
          parts.push(`${label}出土物${a.number}（${a.type}，${a.quantity}）`);
        });
      });
    }
    if (form.has_feature_excavation) {
      form.feature_panels.forEach(fp => {
        const label = fp.feature_number;
        if (fp.complete_status !== '全部清理完成') {
          fp.half_deposits.forEach(hd => {
            hd.specimens.filter(s => s.number).forEach(s => {
              parts.push(`${label}${hd.layer}层标本${s.number}（${s.category}，${s.quantity}）`);
            });
            hd.artifacts_found.filter(a => a.number).forEach(a => {
              parts.push(`${label}${hd.layer}层出土物${a.number}（${a.type}，${a.quantity}）`);
            });
          });
        } else {
          fp.complete_deposits.forEach(cd => {
            cd.specimens.filter(s => s.number).forEach(s => {
              parts.push(`${label}${cd.layer}层标本${s.number}（${s.category}，${s.quantity}）`);
            });
            cd.artifacts_found.filter(a => a.number).forEach(a => {
              parts.push(`${label}${cd.layer}层出土物${a.number}（${a.type}，${a.quantity}）`);
            });
          });
        }
      });
    }
    return parts.join('\n');
  };

  const collectSmallFinds = () => {
    const parts: string[] = [];
    const add = (label: string, sf: SmallFindRow) => {
      parts.push(`${label}小件${sf.number}（${sf.category}，坐标${sf.coordinate}，入库${sf.location}）`);
    };
    if (form.has_layer_excavation) {
      form.layer_panels.forEach((lp, i) => {
        if (lp.has_small_find === '是') {
          const label = form.layer_panels.length > 1 ? `${lp.layer_number}层` : '';
          lp.small_finds.filter(s => s.number).forEach(s => add(label, s));
        }
      });
    }
    if (form.has_feature_excavation) {
      form.feature_panels.forEach(fp => {
        if (fp.has_small_find === '是') {
          fp.small_finds.filter(s => s.number).forEach(s => add(fp.feature_number, s));
        }
      });
    }
    return parts.join('\n');
  };

  // Generate diary text
  const generateDiary = () => {
    const err = validate(); if (err) { alert(err); return; }

    if (form.work_type === 'rest') {
      setGeneratedText(`${form.diary_date} ${form.weather} 风向${form.wind_direction} 湿度${form.humidity}\n探方：${form.trench_number}\n记录人：${form.recorder}\n\n本日未发掘。`);
      return;
    }

    const lines: string[] = [];
    lines.push(`${form.diary_date} ${form.weather} 风向${form.wind_direction} 湿度${form.humidity}`);
    lines.push(`探方：${form.trench_number}`);
    if (form.recorder) lines.push(`记录人：${form.recorder}`);
    lines.push('');

    // Layer excavation
    if (form.has_layer_excavation) {
      lines.push('一、地层发掘');
      for (let pi = 0; pi < form.layer_panels.length; pi++) {
        const lp = form.layer_panels[pi];
        if (form.layer_panels.length > 1) lines.push(`【地层${pi + 1}】${lp.layer_number}层`);
        lines.push(`今日继续发掘${lp.layer_number}层。发掘方向${lp.excavate_direction}，工作进度：${lp.work_progress}。`);
        lines.push(`${lp.excavate_time_start}至${lp.excavate_time_end}，按照${lp.excavate_method}，使用${lp.excavate_tool}对${lp.layer_number}层进行清理。${lp.use_sieve === '是' ? `对${lp.layer_number}层堆积用筛网进行筛选，尽可能仔细地收集出土遗物。` : `并未对${lp.layer_number}层堆积用筛网进行筛选，尽可能仔细地收集出土遗物。`}`);

        const soilDesc = [lp.soil_color, lp.soil_texture].filter(Boolean).join('');
        lines.push(`${lp.layer_number}层为${soilDesc}，${lp.soil_density}。`);

        if (lp.inclusions.some(inc => inc.type)) {
          const incStrs = lp.inclusions.filter(inc => inc.type).map(inc =>
            `${inc.type}（${inc.proportion}，粒径${inc.particleSize}cm，分选${inc.sorting}，${inc.roundness}）`
          );
          lines.push(`包含物：${incStrs.join('；')}。`);
        }

        if (lp.artifacts_found.some(a => a.type)) {
          const artStrs = lp.artifacts_found.filter(a => a.type).map(a => `${a.type}${a.quantity}，编号${a.number}`);
          lines.push(`出土物：${artStrs.join('；')}。`);
        }

        if (lp.specimens.some(s => s.number)) {
          const spStrs = lp.specimens.filter(s => s.number).map(s => `标本${s.number}（${s.category}，${s.quantity}）`);
          lines.push(`采集标本：${spStrs.join('；')}。`);
        }

        if (lp.has_special_feature === '是' && lp.special_feature_desc) {
          lines.push(`发现特殊遗迹现象：${lp.special_feature_desc}。`);
        }

        const corners = [lp.corner_depth_ne && `东北${lp.corner_depth_ne}cm`, lp.corner_depth_se && `东南${lp.corner_depth_se}cm`, lp.corner_depth_sw && `西南${lp.corner_depth_sw}cm`, lp.corner_depth_nw && `西北${lp.corner_depth_nw}cm`].filter(Boolean).join('，');
        if (corners) lines.push(`四角发掘深度：${corners}。`);

        if (lp.layer_completed === '是') {
          lines.push(`${lp.layer_number}层已发掘完毕。`);
          const sumParts = [`${lp.layer_number}层水平分布于全方`];
          if (lp.layer_thickness) sumParts.push(`厚${lp.layer_thickness}cm`);
          if (soilDesc) sumParts.push(`为${soilDesc}`);
          sumParts.push(`${lp.soil_density}`);
          if (lp.upper_interface_shape) sumParts.push(`上界面呈${lp.upper_interface_shape}`);
          if (lp.lower_interface_shape) sumParts.push(`下界面呈${lp.lower_interface_shape}`);
          if (lp.layer_nature) sumParts.push(`应为${lp.layer_nature}`);
          lines.push(`${lp.layer_number}层小结：${sumParts.join('，')}。`);
        }

        // Small finds for this layer
        if (lp.has_small_find === '是' && lp.small_finds.some(s => s.number)) {
          const sfStrs = lp.small_finds.filter(s => s.number).map(s =>
            `小件${s.number}（${s.category}，坐标${s.coordinate}，入库${s.location}）`
          );
          lines.push(`采集小件：${sfStrs.join('；')}。`);
        }

        lines.push('');
      }
    }

    // Scraping
    if (form.has_scraping) {
      const secLabels = ['一', '二', '三', '四'];
      const si = [form.has_layer_excavation].filter(Boolean).length;
      lines.push(`${secLabels[si]}、刮面`);
      lines.push(`${form.scrape_time_start}至${form.scrape_time_end}，对探方进行刮面（${form.scrape_progress}），方向${form.scrape_direction}。`);
      lines.push(`刮面后发现：${form.scrape_observation}`);
      lines.push('');
    }

    // Feature excavation
    if (form.has_feature_excavation) {
      const si = [form.has_layer_excavation, form.has_scraping].filter(Boolean).length;
      const secLabels = ['一', '二', '三', '四'];
      lines.push(`${secLabels[si]}、遗迹发掘`);

      for (let fi = 0; fi < form.feature_panels.length; fi++) {
        const fp = form.feature_panels[fi];
        if (form.feature_panels.length > 1) lines.push(`【遗迹${fi + 1}】${fp.feature_number}`);
        lines.push(`今日开始对${fp.feature_number}进行发掘。${fp.feature_number}为${fp.feature_type}，开口于${fp.feature_opening}层下${fp.break_relation !== '无' ? `，${fp.break_relation}` : ''}。平面呈${fp.shape}，${fp.dimensions}。`);
        lines.push(`采用${fp.excavate_method}进行发掘，解剖方向${fp.section_dir}。`);

        if (fp.complete_status === '全部清理完成') {
          lines.push(`至${form.diary_date}，${fp.feature_number}全部清理完毕。`);
          lines.push(`口部${fp.mouth_clarity}。剖面形状：壁部呈${fp.profile_wall}，底部呈${fp.profile_bottom}。`);
          if (fp.wall_desc) lines.push(`壁面：${fp.wall_desc}。`);
          lines.push(`底部${fp.bottom_clarity}。${fp.bottom_desc ? `底面：${fp.bottom_desc}。` : ''}`);
          if (fp.posthole_angle || fp.posthole_direction) {
            lines.push(`柱洞倾斜角${fp.posthole_angle || '?'}°，方向${fp.posthole_direction || '?'}。`);
          }

          for (const cd of fp.complete_deposits) {
            if (!cd.layer && !cd.texture) continue;
            const cdSoil = [cd.color, cd.texture].filter(Boolean).join('');
            lines.push(`${cd.layer}层为${cdSoil}，${cd.density || '较疏松'}${cd.thickness ? `，厚${cd.thickness}cm` : ''}。上界面呈${cd.upper_interface || '水平状'}，下界面呈${cd.lower_interface || '水平状'}。`);
            if (cd.inclusions.some(inc => inc.type)) {
              const incStrs = cd.inclusions.filter(inc => inc.type).map(inc =>
                `${inc.type}（${inc.proportion}，粒径${inc.particleSize}cm，分选${inc.sorting}，${inc.roundness}）`
              );
              lines.push(`包含物：${incStrs.join('；')}。`);
            }
            if (cd.artifacts_found.some(a => a.type)) {
              const artStrs = cd.artifacts_found.filter(a => a.type).map(a => `${a.type}${a.quantity}，编号${a.number}`);
              lines.push(`出土物：${artStrs.join('；')}。`);
            }
            if (cd.specimens.some(s => s.number)) {
              const spStrs = cd.specimens.filter(s => s.number).map(s => `标本${s.number}（${s.category}，${s.quantity}）`);
              lines.push(`采集标本：${spStrs.join('；')}。`);
            }
            if (cd.soil_sample) lines.push(`土样采集：${cd.soil_sample}。`);
            if (cd.observation) lines.push(`观察记录：${cd.observation}。`);
          }

          if (fp.stratigraphy_diagram) lines.push(`层位关系系络图：${fp.stratigraphy_diagram}。`);

          lines.push('');
          lines.push(`${fp.feature_number}小结：`);
          lines.push(`位置与层位：${fp.feature_number}位于探方内，开口于${fp.feature_opening}层下${fp.break_relation !== '无' ? `，${fp.break_relation}` : ''}。`);
          lines.push(`形状与尺寸：平面呈${fp.shape}，${fp.dimensions}。剖面壁部${fp.profile_wall}，底部${fp.profile_bottom}。口部${fp.mouth_clarity}，底部${fp.bottom_clarity}。`);
        } else {
          for (const hd of fp.half_deposits) {
            if (!hd.layer && !hd.soil_texture) continue;
            const hdSoil = [hd.soil_color, hd.soil_texture].filter(Boolean).join('');
            lines.push(`清理${hd.layer}层：${hdSoil}，${hd.soil_density}${hd.thickness ? `，厚${hd.thickness}cm` : ''}。上界面呈${hd.upper_interface || '水平状'}，下界面呈${hd.lower_interface || '水平状'}。`);
            if (hd.inclusions.some(inc => inc.type)) {
              const incStrs = hd.inclusions.filter(inc => inc.type).map(inc =>
                `${inc.type}（${inc.proportion}，粒径${inc.particleSize}cm，分选${inc.sorting}，${inc.roundness}）`
              );
              lines.push(`包含物：${incStrs.join('；')}。`);
            }
            if (hd.artifacts_found.some(a => a.type)) {
              const artStrs = hd.artifacts_found.filter(a => a.type).map(a => `${a.type}${a.quantity}，编号${a.number}`);
              lines.push(`出土物：${artStrs.join('；')}。`);
            }
            if (hd.specimens.some(s => s.number)) {
              const spStrs = hd.specimens.filter(s => s.number).map(s => `标本${s.number}（${s.category}，${s.quantity}）`);
              lines.push(`采集标本：${spStrs.join('；')}。`);
            }
            if (hd.soil_sample) lines.push(`土样采集：${hd.soil_sample}。`);
          }
          if (fp.special_observation) lines.push(`清理过程中特殊现象观察记录：${fp.special_observation}。`);
          lines.push(`${fp.feature_number}${fp.complete_status}。`);
        }

        // Small finds for this feature
        if (fp.has_small_find === '是' && fp.small_finds.some(s => s.number)) {
          const sfStrs = fp.small_finds.filter(s => s.number).map(s =>
            `小件${s.number}（${s.category}，坐标${s.coordinate}，入库${s.location}）`
          );
          lines.push(`采集小件：${sfStrs.join('；')}。`);
        }

        lines.push('');
      }
    }

    // Summary with auto-collected specimens and small finds
    const si = [form.has_layer_excavation, form.has_scraping, form.has_feature_excavation].filter(Boolean).length;
    const secLabels = ['一', '二', '三', '四'];
    lines.push(`${secLabels[si]}、总结与计划`);
    lines.push(`工作总结与反思：${form.work_summary}`);
    lines.push(`明日计划：${form.tomorrow_plan}`);

    const autoSpecimens = collectSpecimens();
    const autoSmallFinds = collectSmallFinds();
    if (autoSpecimens) lines.push(`当天采集标本：\n${autoSpecimens}`);
    else if (form.specimen_register) lines.push(`当天采集标本：${form.specimen_register}`);
    if (autoSmallFinds) lines.push(`当天出土小件登记：\n${autoSmallFinds}`);
    else if (form.small_finds_register) lines.push(`当天出土小件登记：${form.small_finds_register}`);

    if (form.recorder) { lines.push(''); lines.push(`记录人：${form.recorder}`); }

    setGeneratedText(lines.join('\n'));
  };

  const handleSave = async () => {
    if (!generatedText) { alert('请先生成日记'); return; }
    setSaving(true);
    const res = await fetch('/api/diaries', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diary_date: form.diary_date, weather: form.weather, wind_direction: form.wind_direction, humidity: form.humidity, trench_number: form.trench_number, recorder: form.recorder, content: generatedText }),
    });
    alert(res.ok ? '保存成功' : (await res.json()).error || '保存失败');
    if (res.ok) fetchDiaries();
    setSaving(false);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(generatedText); setCopyMsg('已复制'); } catch { setCopyMsg('复制失败'); }
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const fetchDiaries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(); params.set('page', String(p)); params.set('limit', '10');
    const res = await fetch(`/api/diaries?${params}`); const data = await res.json();
    setDiaries(data.data || []); setTotal(data.total); setTotalPages(data.totalPages); setLoading(false);
  }, [p]);
  useEffect(() => { fetchDiaries(); }, [fetchDiaries]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此日记吗？')) return;
    const res = await fetch(`/api/diaries/${id}`, { method: 'DELETE' }); if (res.ok) fetchDiaries();
  };
  const handleView = (d: DiaryRecord) => { setGeneratedText(d.content); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const inp = 'w-full px-2.5 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white';
  const lbl = 'block text-xs font-medium text-stone-600 mb-1';
  const secCls = 'bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden';
  const req = <span className="text-red-500 ml-0.5">*</span>;
  const densityOpts = ['疏松', '较疏松', '致密', '较致密'];
  const ifShapeOpts = ['水平状', '坡状', '波状', '凸镜状', '凹镜状', '其它'];
  const sortOpts = ['好', '一般', '较差', '极不均匀'];
  const roundOpts = ['棱角的', '较有棱角的', '略有棱角的', '略圆滑的', '圆滑的', '很圆滑的'];
  const weatherOpts = ['晴', '阴', '雨', '多云', '晴转雨', '雨转晴', '雨转多云'];

  const renderInclusionRow = (inc: InclusionRow, ri: number, onChange: (ri: number, key: string, val: string) => void, onDel: (ri: number) => void, showDel: boolean) => (
    <div key={ri} className="grid grid-cols-5 gap-1.5 mb-1.5 items-end">
      <div><input value={inc.type} onChange={e => onChange(ri, 'type', e.target.value)} className={inp} placeholder="种类" /></div>
      <div><input value={inc.proportion} onChange={e => onChange(ri, 'proportion', e.target.value)} className={inp} placeholder="比例" /></div>
      <div><input value={inc.particleSize} onChange={e => onChange(ri, 'particleSize', e.target.value)} className={inp} placeholder="粒径cm" /></div>
      <div><select value={inc.sorting} onChange={e => onChange(ri, 'sorting', e.target.value)} className={inp}>{sortOpts.map(o => <option key={o}>{o}</option>)}</select></div>
      <div className="flex gap-1">
        <select value={inc.roundness} onChange={e => onChange(ri, 'roundness', e.target.value)} className={inp}>{roundOpts.map(o => <option key={o}>{o}</option>)}</select>
        {showDel && <button type="button" onClick={() => onDel(ri)} className="text-red-500 text-xs shrink-0">✕</button>}
      </div>
    </div>
  );

  const renderArtifactRow = (art: ArtifactRow, ri: number, onChange: (ri: number, key: string, val: string) => void, onDel: (ri: number) => void, showDel: boolean) => (
    <div key={ri} className="grid grid-cols-3 gap-1.5 mb-1.5 items-end">
      <div><input value={art.type} onChange={e => onChange(ri, 'type', e.target.value)} className={inp} placeholder="种类" /></div>
      <div><input value={art.quantity} onChange={e => onChange(ri, 'quantity', e.target.value)} className={inp} placeholder="数量" /></div>
      <div className="flex gap-1">
        <input value={art.number} onChange={e => onChange(ri, 'number', e.target.value)} className={inp} placeholder="编号" />
        {showDel && <button type="button" onClick={() => onDel(ri)} className="text-red-500 text-xs shrink-0">✕</button>}
      </div>
    </div>
  );

  const renderSpecimenRow = (sp: SpecimenRow, ri: number, onChange: (ri: number, key: string, val: string) => void, onDel: (ri: number) => void, showDel: boolean) => (
    <div key={ri} className="grid grid-cols-3 gap-1.5 mb-1.5 items-end">
      <div><input value={sp.number} onChange={e => onChange(ri, 'number', e.target.value)} className={inp} placeholder="编号" /></div>
      <div><input value={sp.category} onChange={e => onChange(ri, 'category', e.target.value)} className={inp} placeholder="类别（土样/陶片/骨骼/炭样）" /></div>
      <div className="flex gap-1">
        <input value={sp.quantity} onChange={e => onChange(ri, 'quantity', e.target.value)} className={inp} placeholder="数量" />
        {showDel && <button type="button" onClick={() => onDel(ri)} className="text-red-500 text-xs shrink-0">✕</button>}
      </div>
    </div>
  );

  const renderSmallFindRow = (sf: SmallFindRow, ri: number, onChange: (ri: number, key: string, val: string) => void, onDel: (ri: number) => void, showDel: boolean) => (
    <div key={ri} className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1.5 items-end">
      <div><input value={sf.number} onChange={e => onChange(ri, 'number', e.target.value)} className={inp} placeholder="小件编号" /></div>
      <div><input value={sf.category} onChange={e => onChange(ri, 'category', e.target.value)} className={inp} placeholder="类别" /></div>
      <div><input value={sf.coordinate} onChange={e => onChange(ri, 'coordinate', e.target.value)} className={inp} placeholder="出土坐标" /></div>
      <div className="flex gap-1">
        <input value={sf.location} onChange={e => onChange(ri, 'location', e.target.value)} className={inp} placeholder="入库位置" />
        {showDel && <button type="button" onClick={() => onDel(ri)} className="text-red-500 text-xs shrink-0">✕</button>}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">
      <h2 className="text-2xl font-bold text-stone-800">考古日记生成</h2>

      {/* Basic info */}
      <div className={secCls}>
        <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">📋 基本信息</div>
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className={lbl}>日期{req}</label><input type="date" value={form.diary_date} onChange={e => u('diary_date', e.target.value)} className={inp} /></div>
          <div><label className={lbl}>天气{req}</label><select value={form.weather} onChange={e => u('weather', e.target.value)} className={inp}>{weatherOpts.map(o => <option key={o}>{o}</option>)}</select></div>
          <div><label className={lbl}>风向{req}</label><input value={form.wind_direction} onChange={e => u('wind_direction', e.target.value)} className={inp} placeholder="北风、东南风" /></div>
          <div><label className={lbl}>湿度{req}</label><input value={form.humidity} onChange={e => u('humidity', e.target.value)} className={inp} placeholder="65%" /></div>
          <div><label className={lbl}>探方编号{req}</label><input value={form.trench_number} onChange={e => u('trench_number', e.target.value)} className={inp} placeholder="T0101" /></div>
          <div><label className={lbl}>记录人{req}</label><input value={form.recorder} onChange={e => u('recorder', e.target.value)} className={inp} /></div>
        </div>
      </div>

      {/* Work type */}
      <div className={secCls}>
        <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">📌 当天工作内容</div>
        <div className="px-5 py-3 space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="work_type" checked={form.work_type === 'rest'} onChange={() => u('work_type', 'rest')} className="accent-amber-700" />
            本日未发掘
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="work_type" checked={form.work_type === 'excavation'} onChange={() => u('work_type', 'excavation')} className="accent-amber-700" />
            本日有发掘工作
          </label>
          {form.work_type === 'excavation' && (
            <div className="flex flex-wrap gap-4 ml-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.has_layer_excavation} onChange={e => u('has_layer_excavation', e.target.checked)} className="accent-amber-700" />地层发掘
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.has_scraping} onChange={e => u('has_scraping', e.target.checked)} className="accent-amber-700" />刮面
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.has_feature_excavation} onChange={e => u('has_feature_excavation', e.target.checked)} className="accent-amber-700" />遗迹发掘
              </label>
            </div>
          )}
        </div>
      </div>

      {form.work_type === 'excavation' && (
        <>
          {/* Layer panels */}
          {form.has_layer_excavation && (
            <div className="space-y-4">
              {form.layer_panels.map((lp, pi) => (
                <div key={pi} className={secCls}>
                  <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">🔍 地层发掘{form.layer_panels.length > 1 ? ` (${pi + 1})` : ''}</span>
                    {form.layer_panels.length > 1 && <button type="button" onClick={() => delLayer(pi)} className="text-xs text-red-500 hover:text-red-700">删除此地层</button>}
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div><label className={lbl}>层位编号{req}</label><input value={lp.layer_number} onChange={e => ul(pi, 'layer_number', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>发掘方向{req}</label><input value={lp.excavate_direction} onChange={e => ul(pi, 'excavate_direction', e.target.value)} className={inp} placeholder="从北向南" /></div>
                      <div><label className={lbl}>工作进度{req}</label><input value={lp.work_progress} onChange={e => ul(pi, 'work_progress', e.target.value)} className={inp} placeholder="完成北部二分之一" /></div>
                      <div><label className={lbl}>发掘方法{req}</label><input value={lp.excavate_method} onChange={e => ul(pi, 'excavate_method', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>开始时间{req}</label><input type="time" value={lp.excavate_time_start} onChange={e => ul(pi, 'excavate_time_start', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>结束时间{req}</label><input type="time" value={lp.excavate_time_end} onChange={e => ul(pi, 'excavate_time_end', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>使用工具{req}</label><input value={lp.excavate_tool} onChange={e => ul(pi, 'excavate_tool', e.target.value)} className={inp} /></div>
                      <div><label className={lbl}>是否过筛{req}</label><select value={lp.use_sieve} onChange={e => ul(pi, 'use_sieve', e.target.value)} className={inp}><option>否</option><option>是</option></select></div>
                      <div><label className={lbl}>土色{req}</label><input value={lp.soil_color} onChange={e => ul(pi, 'soil_color', e.target.value)} className={inp} placeholder="浅褐色" /></div>
                      <div><label className={lbl}>土质{req}</label><input value={lp.soil_texture} onChange={e => ul(pi, 'soil_texture', e.target.value)} className={inp} placeholder="粗沙土" /></div>
                      <div><label className={lbl}>致密度{req}</label><select value={lp.soil_density} onChange={e => ul(pi, 'soil_density', e.target.value)} className={inp}>{densityOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                    </div>

                    {/* Inclusions table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={lbl}>包含物{req}</label>
                        <button type="button" onClick={() => addLayerInc(pi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加包含物</button>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                        <span>种类</span><span>比例</span><span>粒径(cm)</span><span>分选度</span><span>圆整度</span>
                      </div>
                      {lp.inclusions.map((inc, ri) => renderInclusionRow(inc, ri, (ri, k, v) => ulInc(pi, ri, k, v), (ri) => delLayerInc(pi, ri), lp.inclusions.length > 1))}
                    </div>

                    {/* Artifacts table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={lbl}>出土物{req}</label>
                        <button type="button" onClick={() => addLayerArt(pi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加出土物</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                        <span>种类</span><span>数量</span><span>编号</span>
                      </div>
                      {lp.artifacts_found.map((art, ri) => renderArtifactRow(art, ri, (ri, k, v) => ulArt(pi, ri, k, v), (ri) => delLayerArt(pi, ri), lp.artifacts_found.length > 1))}
                    </div>

                    {/* Specimen table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={lbl}>采集标本{req}</label>
                        <button type="button" onClick={() => addLayerSpec(pi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加标本</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                        <span>标本编号</span><span>类别</span><span>数量</span>
                      </div>
                      {lp.specimens.map((sp, ri) => renderSpecimenRow(sp, ri, (ri, k, v) => ulSpec(pi, ri, k, v), (ri) => delLayerSpec(pi, ri), lp.specimens.length > 1))}
                    </div>

                    <div>
                      <label className={lbl}>是否发现特殊遗迹现象{req}</label>
                      <select value={lp.has_special_feature} onChange={e => ul(pi, 'has_special_feature', e.target.value)} className={`${inp} w-24`}><option>否</option><option>是</option></select>
                      {lp.has_special_feature === '是' && <textarea value={lp.special_feature_desc} onChange={e => ul(pi, 'special_feature_desc', e.target.value)} className={`${inp} mt-2`} rows={2} placeholder="请描述发现的特殊遗迹现象…" />}
                    </div>

                    <div>
                      <label className={lbl}>四角发掘深度（cm）{req}</label>
                      <div className="grid grid-cols-4 gap-2">
                        <input value={lp.corner_depth_ne} onChange={e => ul(pi, 'corner_depth_ne', e.target.value)} className={inp} placeholder="东北" />
                        <input value={lp.corner_depth_se} onChange={e => ul(pi, 'corner_depth_se', e.target.value)} className={inp} placeholder="东南" />
                        <input value={lp.corner_depth_sw} onChange={e => ul(pi, 'corner_depth_sw', e.target.value)} className={inp} placeholder="西南" />
                        <input value={lp.corner_depth_nw} onChange={e => ul(pi, 'corner_depth_nw', e.target.value)} className={inp} placeholder="西北" />
                      </div>
                    </div>

                    <div>
                      <label className={lbl}>该层是否已发掘完毕{req}</label>
                      <select value={lp.layer_completed} onChange={e => ul(pi, 'layer_completed', e.target.value)} className={`${inp} w-24`}><option>否</option><option>是</option></select>
                      {lp.layer_completed === '是' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                          <div><label className={lbl}>地层厚度{req}</label><input value={lp.layer_thickness} onChange={e => ul(pi, 'layer_thickness', e.target.value)} className={inp} placeholder="X~X cm" /></div>
                          <div><label className={lbl}>堆积上界面形状{req}</label><select value={lp.upper_interface_shape} onChange={e => ul(pi, 'upper_interface_shape', e.target.value)} className={inp}>{ifShapeOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                          <div><label className={lbl}>堆积下界面形状{req}</label><select value={lp.lower_interface_shape} onChange={e => ul(pi, 'lower_interface_shape', e.target.value)} className={inp}>{ifShapeOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                          <div><label className={lbl}>地层性质判断{req}</label><input value={lp.layer_nature} onChange={e => ul(pi, 'layer_nature', e.target.value)} className={inp} placeholder="现代耕土层、明清文化层" /></div>
                        </div>
                      )}
                    </div>

                    {/* Small finds for layer */}
                    <div>
                      <label className={lbl}>是否采集小件{req}</label>
                      <select value={lp.has_small_find} onChange={e => ul(pi, 'has_small_find', e.target.value)} className={`${inp} w-24`}><option>否</option><option>是</option></select>
                      {lp.has_small_find === '是' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={lbl}>小件登记{req}</label>
                            <button type="button" onClick={() => addLayerSF(pi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加小件</button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                            <span>小件编号</span><span>类别</span><span>出土坐标</span><span>入库位置</span>
                          </div>
                          {lp.small_finds.map((sf, ri) => renderSmallFindRow(sf, ri, (ri, k, v) => ulSF(pi, ri, k, v), (ri) => delLayerSF(pi, ri), lp.small_finds.length > 1))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addLayer} className="w-full py-2 border-2 border-dashed border-stone-300 rounded-xl text-sm text-stone-500 hover:border-amber-400 hover:text-amber-700 transition-colors">+ 添加另一个地层</button>
            </div>
          )}

          {/* Scraping */}
          {form.has_scraping && (
            <div className={secCls}>
              <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">🔲 刮面</div>
              <div className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><label className={lbl}>开始时间{req}</label><input type="time" value={form.scrape_time_start} onChange={e => u('scrape_time_start', e.target.value)} className={inp} /></div>
                  <div><label className={lbl}>结束时间{req}</label><input type="time" value={form.scrape_time_end} onChange={e => u('scrape_time_end', e.target.value)} className={inp} /></div>
                  <div><label className={lbl}>工作进度{req}</label><select value={form.scrape_progress} onChange={e => u('scrape_progress', e.target.value)} className={inp}><option>未完成</option><option>全方一次</option><option>全方两次</option><option>全方三次</option></select></div>
                  <div><label className={lbl}>方向{req}</label><input value={form.scrape_direction} onChange={e => u('scrape_direction', e.target.value)} className={inp} placeholder="从北向南" /></div>
                </div>
                <div><label className={lbl}>刮面后发现现象描述{req}</label><textarea value={form.scrape_observation} onChange={e => u('scrape_observation', e.target.value)} className={inp} rows={2} placeholder="描述刮面后发现的遗迹现象…" /></div>
              </div>
            </div>
          )}

          {/* Feature panels */}
          {form.has_feature_excavation && (
            <div className="space-y-4">
              {form.feature_panels.map((fp, fi) => (
                <div key={fi} className={secCls}>
                  <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">🏺 遗迹发掘{form.feature_panels.length > 1 ? ` (${fi + 1})` : ''}</span>
                    {form.feature_panels.length > 1 && <button type="button" onClick={() => delFeature(fi)} className="text-xs text-red-500 hover:text-red-700">删除此遗迹</button>}
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div><label className={lbl}>遗迹编号{req}</label><input value={fp.feature_number} onChange={e => uf(fi, 'feature_number', e.target.value)} className={inp} placeholder="2024HSCH100" /></div>
                      <div><label className={lbl}>遗迹类型{req}</label><select value={fp.feature_type} onChange={e => uf(fi, 'feature_type', e.target.value)} className={inp}><option>灰坑</option><option>灰沟</option><option>房址</option><option>墓葬</option><option>其他</option></select></div>
                      <div><label className={lbl}>开口层位{req}</label><input value={fp.feature_opening} onChange={e => uf(fi, 'feature_opening', e.target.value)} className={inp} placeholder="②层下" /></div>
                      <div><label className={lbl}>打破关系{req}</label><input value={fp.break_relation} onChange={e => uf(fi, 'break_relation', e.target.value)} className={inp} placeholder="打破沟状遗迹（如无可填无）" /></div>
                      <div><label className={lbl}>平面形状{req}</label><select value={fp.shape} onChange={e => uf(fi, 'shape', e.target.value)} className={inp}><option>圆形</option><option>椭圆形</option><option>长方形</option><option>长条形</option><option>不规则形</option></select></div>
                      <div><label className={lbl}>尺寸{req}</label><input value={fp.dimensions} onChange={e => uf(fi, 'dimensions', e.target.value)} className={inp} placeholder="直径80~85厘米" /></div>
                      <div><label className={lbl}>发掘方法{req}</label><select value={fp.excavate_method} onChange={e => uf(fi, 'excavate_method', e.target.value)} className={inp}><option>1/2发掘法</option><option>全面发掘</option></select></div>
                      <div><label className={lbl}>解剖方向{req}</label><input value={fp.section_dir} onChange={e => uf(fi, 'section_dir', e.target.value)} className={inp} placeholder="正南北" /></div>
                      <div><label className={lbl}>完工状态{req}</label><select value={fp.complete_status} onChange={e => uf(fi, 'complete_status', e.target.value)} className={inp}><option>二分之一完成</option><option>二分之一未完成</option><option>全部清理完成</option></select></div>
                    </div>

                    {/* Half-complete: deposit layers matching layer format */}
                    {fp.complete_status !== '全部清理完成' && (
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={lbl}>当天清理堆积描述{req}</label>
                            <button type="button" onClick={() => addHalfDep(fi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加层</button>
                          </div>
                          {fp.half_deposits.map((hd, di) => (
                            <div key={di} className="border border-stone-200 rounded-lg p-3 mb-2 space-y-2">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div><label className={lbl}>层位{req}</label><input value={hd.layer} onChange={e => uhd(fi, di, 'layer', e.target.value)} className={inp} placeholder="层位" /></div>
                                <div><label className={lbl}>土质{req}</label><input value={hd.soil_texture} onChange={e => uhd(fi, di, 'soil_texture', e.target.value)} className={inp} placeholder="土质" /></div>
                                <div><label className={lbl}>土色{req}</label><input value={hd.soil_color} onChange={e => uhd(fi, di, 'soil_color', e.target.value)} className={inp} placeholder="土色" /></div>
                                <div><label className={lbl}>致密度{req}</label><select value={hd.soil_density} onChange={e => uhd(fi, di, 'soil_density', e.target.value)} className={inp}>{densityOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                                <div><label className={lbl}>厚度(cm){req}</label><input value={hd.thickness} onChange={e => uhd(fi, di, 'thickness', e.target.value)} className={inp} placeholder="厚度cm" /></div>
                                <div><label className={lbl}>上界面形状{req}</label><select value={hd.upper_interface} onChange={e => uhd(fi, di, 'upper_interface', e.target.value)} className={inp}>{ifShapeOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                                <div><label className={lbl}>下界面形状{req}</label><select value={hd.lower_interface} onChange={e => uhd(fi, di, 'lower_interface', e.target.value)} className={inp}>{ifShapeOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                                <div><label className={lbl}>土样采集</label><input value={hd.soil_sample} onChange={e => uhd(fi, di, 'soil_sample', e.target.value)} className={inp} placeholder="土样采集" /></div>
                              </div>

                              {/* Half deposit inclusions */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-stone-600">包含物{req}</span>
                                  <button type="button" onClick={() => addHdInc(fi, di)} className="text-xs text-amber-700">+ 添加</button>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                                  <span>种类</span><span>比例</span><span>粒径</span><span>分选度</span><span>圆整度</span>
                                </div>
                                {hd.inclusions.map((inc, ri) => renderInclusionRow(inc, ri, (ri, k, v) => uhdInc(fi, di, ri, k, v), (ri) => delHdInc(fi, di, ri), hd.inclusions.length > 1))}
                              </div>

                              {/* Half deposit artifacts */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-stone-600">出土物{req}</span>
                                  <button type="button" onClick={() => addHdArt(fi, di)} className="text-xs text-amber-700">+ 添加</button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                                  <span>种类</span><span>数量</span><span>编号</span>
                                </div>
                                {hd.artifacts_found.map((art, ri) => renderArtifactRow(art, ri, (ri, k, v) => uhdArt(fi, di, ri, k, v), (ri) => delHdArt(fi, di, ri), hd.artifacts_found.length > 1))}
                              </div>

                              {/* Half deposit specimens */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-stone-600">采集标本{req}</span>
                                  <button type="button" onClick={() => addHdSpec(fi, di)} className="text-xs text-amber-700">+ 添加</button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                                  <span>标本编号</span><span>类别</span><span>数量</span>
                                </div>
                                {hd.specimens.map((sp, ri) => renderSpecimenRow(sp, ri, (ri, k, v) => uhdSpec(fi, di, ri, k, v), (ri) => delHdSpec(fi, di, ri), hd.specimens.length > 1))}
                              </div>

                              {fp.half_deposits.length > 1 && <button type="button" onClick={() => delHalfDep(fi, di)} className="text-xs text-red-500">删除此层</button>}
                            </div>
                          ))}
                        </div>
                        <div><label className={lbl}>清理过程中特殊现象观察记录{req}</label><textarea value={fp.special_observation} onChange={e => uf(fi, 'special_observation', e.target.value)} className={inp} rows={2} placeholder="特殊现象观察记录…" /></div>
                      </div>
                    )}

                    {/* Complete fields */}
                    {fp.complete_status === '全部清理完成' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div><label className={lbl}>口部{req}</label><select value={fp.mouth_clarity} onChange={e => uf(fi, 'mouth_clarity', e.target.value)} className={inp}><option>明显</option><option>较明显</option><option>不明显</option></select></div>
                          <div><label className={lbl}>剖面壁部{req}</label><select value={fp.profile_wall} onChange={e => uf(fi, 'profile_wall', e.target.value)} className={inp}><option>锥形</option><option>筒形</option><option>袋形</option><option>弧形</option></select></div>
                          <div><label className={lbl}>剖面底部{req}</label><select value={fp.profile_bottom} onChange={e => uf(fi, 'profile_bottom', e.target.value)} className={inp}><option>尖底</option><option>圜底</option><option>平底</option></select></div>
                          <div><label className={lbl}>底部{req}</label><select value={fp.bottom_clarity} onChange={e => uf(fi, 'bottom_clarity', e.target.value)} className={inp}><option>明显</option><option>较明显</option><option>不明显</option></select></div>
                        </div>
                        <div><label className={lbl}>壁面（加工痕迹、倾斜度、粗糙或光滑）{req}</label><textarea value={fp.wall_desc} onChange={e => uf(fi, 'wall_desc', e.target.value)} className={inp} rows={1} /></div>
                        <div><label className={lbl}>底面（加工痕迹、粗糙或光滑）{req}</label><textarea value={fp.bottom_desc} onChange={e => uf(fi, 'bottom_desc', e.target.value)} className={inp} rows={1} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={lbl}>柱洞倾斜角（如适用）{req}</label><input value={fp.posthole_angle} onChange={e => uf(fi, 'posthole_angle', e.target.value)} className={inp} placeholder="°" /></div>
                          <div><label className={lbl}>柱洞方向（如适用）{req}</label><input value={fp.posthole_direction} onChange={e => uf(fi, 'posthole_direction', e.target.value)} className={inp} placeholder="正北等" /></div>
                        </div>

                        {/* Complete deposit layers */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={lbl}>堆积描述{req}</label>
                            <button type="button" onClick={() => addCompDep(fi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加层</button>
                          </div>
                          {fp.complete_deposits.map((cd, di) => (
                            <div key={di} className="border border-stone-200 rounded-lg p-3 mb-2 space-y-2">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div><label className={lbl}>层位{req}</label><input value={cd.layer} onChange={e => ucd(fi, di, 'layer', e.target.value)} className={inp} placeholder="层位" /></div>
                                <div><label className={lbl}>土质{req}</label><input value={cd.texture} onChange={e => ucd(fi, di, 'texture', e.target.value)} className={inp} placeholder="土质" /></div>
                                <div><label className={lbl}>土色{req}</label><input value={cd.color} onChange={e => ucd(fi, di, 'color', e.target.value)} className={inp} placeholder="土色" /></div>
                                <div><label className={lbl}>致密度{req}</label><select value={cd.density} onChange={e => ucd(fi, di, 'density', e.target.value)} className={inp}>{densityOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                                <div><label className={lbl}>厚度(cm){req}</label><input value={cd.thickness} onChange={e => ucd(fi, di, 'thickness', e.target.value)} className={inp} placeholder="厚度cm" /></div>
                                <div><label className={lbl}>上界面形状{req}</label><select value={cd.upper_interface} onChange={e => ucd(fi, di, 'upper_interface', e.target.value)} className={inp}>{ifShapeOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                                <div><label className={lbl}>下界面形状{req}</label><select value={cd.lower_interface} onChange={e => ucd(fi, di, 'lower_interface', e.target.value)} className={inp}>{ifShapeOpts.map(o => <option key={o}>{o}</option>)}</select></div>
                                <div><label className={lbl}>土样采集</label><input value={cd.soil_sample} onChange={e => ucd(fi, di, 'soil_sample', e.target.value)} className={inp} placeholder="土样采集" /></div>
                              </div>

                              {/* Inclusions */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-stone-600">包含物{req}</span>
                                  <button type="button" onClick={() => addCompInc(fi, di)} className="text-xs text-amber-700">+ 添加</button>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                                  <span>种类</span><span>比例</span><span>粒径</span><span>分选度</span><span>圆整度</span>
                                </div>
                                {cd.inclusions.map((inc, ri) => renderInclusionRow(inc, ri, (ri, k, v) => ucdInc(fi, di, ri, k, v), (ri) => delCompInc(fi, di, ri), cd.inclusions.length > 1))}
                              </div>

                              {/* Artifacts */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-stone-600">出土物{req}</span>
                                  <button type="button" onClick={() => addCdArt(fi, di)} className="text-xs text-amber-700">+ 添加</button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                                  <span>种类</span><span>数量</span><span>编号</span>
                                </div>
                                {cd.artifacts_found.map((art, ri) => renderArtifactRow(art, ri, (ri, k, v) => ucdArt(fi, di, ri, k, v), (ri) => delCdArt(fi, di, ri), cd.artifacts_found.length > 1))}
                              </div>

                              {/* Specimens */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-stone-600">采集标本{req}</span>
                                  <button type="button" onClick={() => addCdSpec(fi, di)} className="text-xs text-amber-700">+ 添加</button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                                  <span>标本编号</span><span>类别</span><span>数量</span>
                                </div>
                                {cd.specimens.map((sp, ri) => renderSpecimenRow(sp, ri, (ri, k, v) => ucdSpec(fi, di, ri, k, v), (ri) => delCdSpec(fi, di, ri), cd.specimens.length > 1))}
                              </div>

                              <div><label className={lbl}>观察记录{req}</label><input value={cd.observation} onChange={e => ucd(fi, di, 'observation', e.target.value)} className={inp} placeholder="观察记录" /></div>
                              {fp.complete_deposits.length > 1 && <button type="button" onClick={() => delCompDep(fi, di)} className="text-xs text-red-500">删除此层</button>}
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className={lbl}>层位关系系络图{req}</label>
                          {fp.stratigraphy_diagram ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-green-700 truncate flex-1">已上传: {fp.stratigraphy_diagram}</span>
                              <button type="button" onClick={() => uf(fi, 'stratigraphy_diagram', '')} className="text-xs text-red-500">清除</button>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => { const file = e.target.files?.[0]; if (file) handleDiagramUpload(fi, file); }}
                                className="text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                              />
                              {uploading[`diagram-${fi}`] && <span className="text-xs text-amber-600 ml-2">上传中…</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Small finds for feature */}
                    <div>
                      <label className={lbl}>是否采集小件{req}</label>
                      <select value={fp.has_small_find} onChange={e => uf(fi, 'has_small_find', e.target.value)} className={`${inp} w-24`}><option>否</option><option>是</option></select>
                      {fp.has_small_find === '是' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={lbl}>小件登记{req}</label>
                            <button type="button" onClick={() => addFeatSF(fi)} className="text-xs text-amber-700 hover:text-amber-800">+ 添加小件</button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1 text-xs text-stone-400 px-1">
                            <span>小件编号</span><span>类别</span><span>出土坐标</span><span>入库位置</span>
                          </div>
                          {fp.small_finds.map((sf, ri) => renderSmallFindRow(sf, ri, (ri, k, v) => ufSF(fi, ri, k, v), (ri) => delFeatSF(fi, ri), fp.small_finds.length > 1))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFeature} className="w-full py-2 border-2 border-dashed border-stone-300 rounded-xl text-sm text-stone-500 hover:border-amber-400 hover:text-amber-700 transition-colors">+ 添加另一个遗迹</button>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      <div className={secCls}>
        <div className="px-5 py-3 border-b border-stone-100 text-sm font-medium text-stone-700">📝 总结、计划与采集登记</div>
        <div className="px-5 py-4 space-y-3">
          <div><label className={lbl}>工作总结与反思{req}</label><textarea value={form.work_summary} onChange={e => u('work_summary', e.target.value)} className={inp} rows={3} placeholder="本日工作内容总结与反思…" /></div>
          <div><label className={lbl}>明日计划{req}</label><textarea value={form.tomorrow_plan} onChange={e => u('tomorrow_plan', e.target.value)} className={inp} rows={2} placeholder="明日工作计划…" /></div>
          <div className="text-xs text-stone-400">标本与小件登记将在生成日记时自动从前面的表格中汇总。</div>
        </div>
      </div>

      {/* Generate */}
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={generateDiary} className="bg-amber-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors">生成日记</button>
      </div>

      {/* Preview */}
      {generatedText && (
        <div className={secCls}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
            <span className="text-sm font-medium text-stone-700">日记预览</span>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="text-xs px-3 py-1 rounded border border-stone-300 text-stone-600 hover:bg-stone-50">{copyMsg || '复制'}</button>
              <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1 rounded bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50">{saving ? '保存中…' : '保存'}</button>
            </div>
          </div>
          <pre className="px-5 py-4 text-sm text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{generatedText}</pre>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100"><span className="text-sm font-medium text-stone-700">已保存日记</span></div>
        {loading ? <div className="px-5 py-8 text-center text-stone-400 text-sm">加载中…</div> : diaries.length === 0 ? <div className="px-5 py-8 text-center text-stone-400 text-sm">暂无日记</div> : (
          <div className="divide-y divide-stone-100">
            {diaries.map(d => (
              <div key={d.id} className="px-5 py-3 hover:bg-stone-50 flex items-center justify-between">
                <div className="min-w-0 flex-1"><div className="text-sm font-medium text-stone-800 truncate">{d.diary_date} {d.weather} {d.trench_number && `· ${d.trench_number}`}</div><div className="text-xs text-stone-500 mt-0.5 truncate">{d.content.slice(0, 100)}…</div></div>
                <div className="flex gap-1 ml-3 shrink-0"><button onClick={() => handleView(d)} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200">查看</button><button onClick={() => handleDelete(d.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button></div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 text-sm">
            <span className="text-stone-500">共 {total} 条</span>
            <div className="flex gap-1"><button disabled={p <= 1} onClick={() => setP(p => p - 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">上一页</button><span className="px-3 py-1 text-stone-600">第 {p}/{totalPages} 页</span><button disabled={p >= totalPages} onClick={() => setP(p => p + 1)} className="px-3 py-1 rounded border border-stone-300 disabled:opacity-30 hover:bg-stone-100">下一页</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
