import { getDiariesByFeatureNumber } from './diaries';
import { FeatureInput, LayerInput, ArtifactInput, InclusionRow, SpecimenRow } from './excavation';

// —— 日记侧结构化数据形状（与 src/app/diary/page.tsx 的 FeaturePanel 对应）——
interface ArtifactRow { type?: string; quantity?: string; number?: string; }
interface SmallFindRow { number?: string; category?: string; coordinate?: string; location?: string; }

interface Deposit {
  layer?: string;
  soil_texture?: string;
  soil_color?: string;
  density?: string;
  thickness?: string;
  upper_interface?: string;
  lower_interface?: string;
  inclusions?: InclusionRow[];
  artifacts_found?: ArtifactRow[];
  specimens?: SpecimenRow[];
  soil_sample?: string;
  observation?: string;
}

interface FeaturePanel {
  feature_number?: string;
  feature_position?: string;
  feature_type?: string;
  feature_opening?: string;
  break_relation?: string;
  shape?: string;
  dimensions?: string;
  excavate_method?: string;
  section_dir?: string;
  complete_status?: string;
  half_deposits?: (Deposit & { soil_density?: string })[];
  complete_deposits?: (Deposit & { texture?: string; color?: string })[];
  special_observation?: string;
  mouth_clarity?: string;
  profile_wall?: string;
  profile_bottom?: string;
  wall_desc?: string;
  bottom_clarity?: string;
  bottom_desc?: string;
  has_small_find?: string;
  small_finds?: SmallFindRow[];
}

interface DiaryWithPanels {
  id: number;
  diary_date: string;
  recorder: string;
  trench_number: string;
  panels: FeaturePanel[];
}

export interface ImportedFeature {
  feature: FeatureInput & { layers: LayerInput[]; artifacts: ArtifactInput[] };
  diaries: { id: number; diary_date: string; recorder: string; trench_number: string }[];
}

function lastNonEmpty(values: (string | undefined)[]): string {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v && v.trim()) return v;
  }
  return '';
}

function normalizeDeposit(d: Deposit & { soil_density?: string; texture?: string; color?: string }): Deposit {
  return {
    layer: d.layer,
    soil_texture: d.soil_texture ?? d.texture,
    soil_color: d.soil_color ?? d.color,
    density: d.density ?? d.soil_density,
    thickness: d.thickness,
    upper_interface: d.upper_interface,
    lower_interface: d.lower_interface,
    inclusions: d.inclusions,
    artifacts_found: d.artifacts_found,
    specimens: d.specimens,
    soil_sample: d.soil_sample,
    observation: d.observation,
  };
}

function depositToLayer(d: Deposit): LayerInput {
  return {
    layer_number: d.layer || '',
    soil_color: d.soil_color || '',
    soil_texture: d.soil_texture || '',
    density: d.density || '',
    thickness: d.thickness || '',
    deposit_shape: '',
    inclusions: d.inclusions || [],
    specimens: d.specimens || [],
    soil_sample: d.soil_sample || '',
    upper_interface: d.upper_interface || '',
    lower_interface: d.lower_interface || '',
    observation: d.observation || '',
    preservation: '',
    cleaning_method: '',
    deposit_nature: '',
    depth_text: '',
    remarks: '',
  };
}

function depositArtifacts(layerNumber: string, artifacts: ArtifactRow[] | undefined): ArtifactInput[] {
  if (!artifacts) return [];
  return artifacts
    .filter(a => a.type || a.number)
    .map(a => ({ layer_number: layerNumber, type: a.type || '', quantity: a.quantity || '', number: a.number || '', remarks: '' }));
}

function draftProcess(featureNumber: string, diaries: DiaryWithPanels[]): string {
  const lines: string[] = [];
  for (const d of diaries) {
    for (const p of d.panels) {
      const status = p.complete_status === '全部清理完成' ? '全部清理完毕' : (p.complete_status || '继续发掘');
      let line = `${d.diary_date}：对${featureNumber}进行发掘，${status}`;
      if (p.excavate_method) line += `，采用${p.excavate_method}`;
      if (p.section_dir) line += `，解剖方向${p.section_dir}`;
      lines.push(line + '。');
    }
  }
  return lines.join('\n');
}

export function importFeatureFromDiaries(featureNumber: string): ImportedFeature | null {
  const diaries = getDiariesByFeatureNumber(featureNumber);
  if (diaries.length === 0) return null;

  const withPanels: DiaryWithPanels[] = [];
  for (const d of diaries) {
    let data: { feature_panels?: FeaturePanel[] } = {};
    try { data = JSON.parse(d.feature_data || '{}'); } catch { /* ignore */ }
    const panels = (data.feature_panels || []).filter(p => p.feature_number === featureNumber);
    if (panels.length > 0) {
      withPanels.push({ id: d.id, diary_date: d.diary_date, recorder: d.recorder, trench_number: d.trench_number, panels });
    }
  }
  if (withPanels.length === 0) return null;

  const allPanels = withPanels.flatMap(d => d.panels);

  // 标量字段：后一条日记优先（越晚越完整）
  const stratigraphy = lastNonEmpty(allPanels.map(p => {
    const parts = [p.feature_opening && `开口于${p.feature_opening}层下`, p.break_relation && p.break_relation !== '无' ? p.break_relation : ''];
    return parts.filter(Boolean).join('，');
  }));

  const wall_bottom_detail = lastNonEmpty(allPanels.map(p => {
    const parts = [
      p.profile_wall && `壁部呈${p.profile_wall}`,
      p.profile_bottom && `底部呈${p.profile_bottom}`,
      p.wall_desc && `壁面${p.wall_desc}`,
      p.bottom_desc && `底面${p.bottom_desc}`,
      p.mouth_clarity && `口部${p.mouth_clarity}`,
      p.bottom_clarity && `底部${p.bottom_clarity}`,
    ];
    return parts.filter(Boolean).join('；');
  }));

  // 堆积层/遗物：优先「全部清理完成」的 complete_deposits，否则聚合各日 half_deposits
  const completePanels = allPanels.filter(p => p.complete_status === '全部清理完成' && (p.complete_deposits || []).length > 0);
  let deposits: Deposit[];
  if (completePanels.length > 0) {
    deposits = completePanels.flatMap(p => (p.complete_deposits || []).map(normalizeDeposit));
  } else {
    deposits = allPanels.flatMap(p => (p.half_deposits || []).map(normalizeDeposit));
  }

  const layers: LayerInput[] = deposits
    .filter(d => d.layer || d.soil_color || d.soil_texture)
    .map(depositToLayer);

  const artifacts: ArtifactInput[] = deposits.flatMap(d => depositArtifacts(d.layer || '', d.artifacts_found));
  for (const p of allPanels) {
    if (p.has_small_find === '是' && p.small_finds) {
      for (const s of p.small_finds) {
        if (!s.number) continue;
        artifacts.push({
          layer_number: '',
          type: s.category || '小件',
          quantity: '',
          number: s.number,
          remarks: [s.coordinate && `坐标${s.coordinate}`, s.location && `入库${s.location}`].filter(Boolean).join('，'),
        });
      }
    }
  }

  const feature: ImportedFeature['feature'] = {
    feature_number: featureNumber,
    feature_type: lastNonEmpty(allPanels.map(p => p.feature_type)),
    trench_number: lastNonEmpty(withPanels.map(d => d.trench_number)),
    position: lastNonEmpty(allPanels.map(p => p.feature_position)),
    shape: lastNonEmpty(allPanels.map(p => p.shape)),
    opening_size: lastNonEmpty(allPanels.map(p => p.dimensions)),
    stratigraphy,
    wall_bottom_detail,
    excavation_process: draftProcess(featureNumber, withPanels),
    sampling: '',
    recorder: lastNonEmpty(withPanels.map(d => d.recorder)),
    record_date: withPanels[withPanels.length - 1].diary_date,
    layers,
    artifacts,
  };

  return {
    feature,
    diaries: withPanels.map(d => ({ id: d.id, diary_date: d.diary_date, recorder: d.recorder, trench_number: d.trench_number })),
  };
}
