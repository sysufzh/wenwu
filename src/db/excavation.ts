import { getDb } from './index';

export interface InclusionRow {
  type?: string;
  proportion?: string;
  particleSize?: string;
  sorting?: string;
  roundness?: string;
}

export interface SpecimenRow {
  number?: string;
  category?: string;
  quantity?: string;
}

export interface ExcavationFeature {
  id: number;
  feature_number: string;
  feature_type: string;
  trench_number: string;
  position: string;
  shape: string;
  opening_size: string;
  depth: string;
  bottom_size: string;
  drawing_info: string;
  photo_info: string;
  excavation_process: string;
  wall_bottom_detail: string;
  stratigraphy: string;
  dating: string;
  function_nature: string;
  sampling: string;
  remarks: string;
  recorder: string;
  record_date: string;
  site_name: string;
  district: string;
  year: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureLayer {
  id: number;
  feature_id: number;
  layer_number: string;
  soil_color: string;
  soil_texture: string;
  density: string;
  thickness: string;
  deposit_shape: string;
  inclusions: string;
  inclusions_json: string;
  specimens_json: string;
  soil_sample: string;
  upper_interface: string;
  lower_interface: string;
  observation: string;
  preservation: string;
  cleaning_method: string;
  deposit_nature: string;
  depth_text: string;
  remarks: string;
  sort_order: number;
}

export interface FeatureArtifact {
  id: number;
  feature_id: number;
  layer_number: string;
  type: string;
  quantity: string;
  number: string;
  remarks: string;
  sort_order: number;
}

export interface FeatureWithChildren extends ExcavationFeature {
  layers: FeatureLayer[];
  artifacts: FeatureArtifact[];
}

export interface FeatureInput {
  feature_number?: string;
  feature_type?: string;
  trench_number?: string;
  position?: string;
  shape?: string;
  opening_size?: string;
  depth?: string;
  bottom_size?: string;
  drawing_info?: string;
  photo_info?: string;
  excavation_process?: string;
  wall_bottom_detail?: string;
  stratigraphy?: string;
  dating?: string;
  function_nature?: string;
  sampling?: string;
  remarks?: string;
  recorder?: string;
  record_date?: string;
  site_name?: string;
  district?: string;
  year?: string;
  layers?: LayerInput[];
  artifacts?: ArtifactInput[];
}

export interface LayerInput {
  layer_number?: string;
  soil_color?: string;
  soil_texture?: string;
  density?: string;
  thickness?: string;
  deposit_shape?: string;
  inclusions?: InclusionRow[];
  specimens?: SpecimenRow[];
  soil_sample?: string;
  upper_interface?: string;
  lower_interface?: string;
  observation?: string;
  preservation?: string;
  cleaning_method?: string;
  deposit_nature?: string;
  depth_text?: string;
  remarks?: string;
  sort_order?: number;
}

export interface ArtifactInput {
  layer_number?: string;
  type?: string;
  quantity?: string;
  number?: string;
  remarks?: string;
  sort_order?: number;
}

export interface FeatureListParams {
  search?: string;
  page?: number;
  limit?: number;
}

const FEATURE_FIELDS = [
  'feature_number', 'feature_type', 'trench_number', 'position', 'shape', 'opening_size', 'depth',
  'bottom_size', 'drawing_info', 'photo_info', 'excavation_process', 'wall_bottom_detail',
  'stratigraphy', 'dating', 'function_nature', 'sampling', 'remarks', 'recorder',
  'record_date', 'site_name', 'district', 'year',
].join(', ');

export function getFeatures(params: FeatureListParams = {}) {
  const db = getDb();
  const { search, page = 1, limit = 20 } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};
  if (search) {
    where += ' AND (feature_number LIKE @search OR trench_number LIKE @search OR position LIKE @search OR recorder LIKE @search)';
    conditions['search'] = `%${search}%`;
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM excavation_features ${where}`).get(conditions) as { total: number };
  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM excavation_features ${where} ORDER BY id DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as ExcavationFeature[];

  return {
    data: rows,
    total: countRow.total,
    page,
    limit,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

export function getFeatureById(id: number): FeatureWithChildren | undefined {
  const db = getDb();
  const feature = db.prepare('SELECT * FROM excavation_features WHERE id = ?').get(id) as ExcavationFeature | undefined;
  if (!feature) return undefined;

  const layers = db.prepare('SELECT * FROM feature_layers WHERE feature_id = ? ORDER BY sort_order, id').all(id) as FeatureLayer[];
  const artifacts = db.prepare('SELECT * FROM feature_artifacts WHERE feature_id = ? ORDER BY sort_order, id').all(id) as FeatureArtifact[];

  return { ...feature, layers, artifacts };
}

export function createFeature(input: FeatureInput): FeatureWithChildren {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO excavation_features (${FEATURE_FIELDS}, created_at, updated_at)
     VALUES (@feature_number, @feature_type, @trench_number, @position, @shape, @opening_size, @depth,
             @bottom_size, @drawing_info, @photo_info, @excavation_process, @wall_bottom_detail,
             @stratigraphy, @dating, @function_nature, @sampling, @remarks, @recorder,
             @record_date, @site_name, @district, @year, @created_at, @updated_at)`
  );
  const result = stmt.run({
    feature_number: input.feature_number || '',
    feature_type: input.feature_type || '',
    trench_number: input.trench_number || '',
    position: input.position || '',
    shape: input.shape || '',
    opening_size: input.opening_size || '',
    depth: input.depth || '',
    bottom_size: input.bottom_size || '',
    drawing_info: input.drawing_info || '',
    photo_info: input.photo_info || '',
    excavation_process: input.excavation_process || '',
    wall_bottom_detail: input.wall_bottom_detail || '',
    stratigraphy: input.stratigraphy || '',
    dating: input.dating || '',
    function_nature: input.function_nature || '',
    sampling: input.sampling || '',
    remarks: input.remarks || '',
    recorder: input.recorder || '',
    record_date: input.record_date || '',
    site_name: input.site_name || '牛头山遗址',
    district: input.district || '',
    year: input.year || '',
    created_at: now,
    updated_at: now,
  });

  const featureId = result.lastInsertRowid as number;
  saveChildren(db, featureId, input.layers || [], input.artifacts || []);
  return getFeatureById(featureId)!;
}

export function updateFeature(id: number, input: FeatureInput): FeatureWithChildren | undefined {
  const db = getDb();
  const existing = getFeatureById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `UPDATE excavation_features SET
      feature_number = @feature_number, feature_type = @feature_type, trench_number = @trench_number, position = @position,
      shape = @shape, opening_size = @opening_size, depth = @depth, bottom_size = @bottom_size,
      drawing_info = @drawing_info, photo_info = @photo_info, excavation_process = @excavation_process,
      wall_bottom_detail = @wall_bottom_detail, stratigraphy = @stratigraphy, dating = @dating,
      function_nature = @function_nature, sampling = @sampling, remarks = @remarks,
      recorder = @recorder, record_date = @record_date, site_name = @site_name,
      district = @district, year = @year, updated_at = @updated_at
    WHERE id = @id`
  );
  stmt.run({
    id,
    feature_number: input.feature_number ?? existing.feature_number,
    feature_type: input.feature_type ?? existing.feature_type,
    trench_number: input.trench_number ?? existing.trench_number,
    position: input.position ?? existing.position,
    shape: input.shape ?? existing.shape,
    opening_size: input.opening_size ?? existing.opening_size,
    depth: input.depth ?? existing.depth,
    bottom_size: input.bottom_size ?? existing.bottom_size,
    drawing_info: input.drawing_info ?? existing.drawing_info,
    photo_info: input.photo_info ?? existing.photo_info,
    excavation_process: input.excavation_process ?? existing.excavation_process,
    wall_bottom_detail: input.wall_bottom_detail ?? existing.wall_bottom_detail,
    stratigraphy: input.stratigraphy ?? existing.stratigraphy,
    dating: input.dating ?? existing.dating,
    function_nature: input.function_nature ?? existing.function_nature,
    sampling: input.sampling ?? existing.sampling,
    remarks: input.remarks ?? existing.remarks,
    recorder: input.recorder ?? existing.recorder,
    record_date: input.record_date ?? existing.record_date,
    site_name: input.site_name ?? existing.site_name,
    district: input.district ?? existing.district,
    year: input.year ?? existing.year,
    updated_at: now,
  });

  if (input.layers !== undefined || input.artifacts !== undefined) {
    db.prepare('DELETE FROM feature_layers WHERE feature_id = ?').run(id);
    db.prepare('DELETE FROM feature_artifacts WHERE feature_id = ?').run(id);
    saveChildren(db, id, input.layers || [], input.artifacts || []);
  }

  return getFeatureById(id);
}

export function deleteFeature(id: number): boolean {
  const db = getDb();
  db.prepare('DELETE FROM feature_layers WHERE feature_id = ?').run(id);
  db.prepare('DELETE FROM feature_artifacts WHERE feature_id = ?').run(id);
  const result = db.prepare('DELETE FROM excavation_features WHERE id = ?').run(id);
  return result.changes > 0;
}

function saveChildren(db: ReturnType<typeof getDb>, featureId: number, layers: LayerInput[], artifacts: ArtifactInput[]) {
  const insertLayer = db.prepare(
    `INSERT INTO feature_layers (feature_id, layer_number, soil_color, soil_texture, density, thickness,
       deposit_shape, inclusions, inclusions_json, specimens_json, soil_sample, upper_interface, lower_interface, observation,
       preservation, cleaning_method, deposit_nature, depth_text, remarks, sort_order)
     VALUES (@feature_id, @layer_number, @soil_color, @soil_texture, @density, @thickness,
       @deposit_shape, @inclusions, @inclusions_json, @specimens_json, @soil_sample, @upper_interface, @lower_interface, @observation,
       @preservation, @cleaning_method, @deposit_nature, @depth_text, @remarks, @sort_order)`
  );
  layers.forEach((l, i) => {
    insertLayer.run({
      feature_id: featureId,
      layer_number: l.layer_number || '',
      soil_color: l.soil_color || '',
      soil_texture: l.soil_texture || '',
      density: l.density || '',
      thickness: l.thickness || '',
      deposit_shape: l.deposit_shape || '',
      inclusions: '',
      inclusions_json: JSON.stringify(l.inclusions || []),
      specimens_json: JSON.stringify(l.specimens || []),
      soil_sample: l.soil_sample || '',
      upper_interface: l.upper_interface || '',
      lower_interface: l.lower_interface || '',
      observation: l.observation || '',
      preservation: l.preservation || '',
      cleaning_method: l.cleaning_method || '',
      deposit_nature: l.deposit_nature || '',
      depth_text: l.depth_text || '',
      remarks: l.remarks || '',
      sort_order: l.sort_order ?? i,
    });
  });

  const insertArtifact = db.prepare(
    `INSERT INTO feature_artifacts (feature_id, layer_number, type, quantity, number, remarks, sort_order)
     VALUES (@feature_id, @layer_number, @type, @quantity, @number, @remarks, @sort_order)`
  );
  artifacts.forEach((a, i) => {
    insertArtifact.run({
      feature_id: featureId,
      layer_number: a.layer_number || '',
      type: a.type || '',
      quantity: a.quantity || '',
      number: a.number || '',
      remarks: a.remarks || '',
      sort_order: a.sort_order ?? i,
    });
  });
}

// 结构化包含物 → 文本（与日记系统生成正文逻辑一致）
export function composeInclusionsText(inclusions: InclusionRow[]): string {
  if (!inclusions) return '';
  return inclusions
    .filter(inc => inc.type)
    .map(inc => {
      const detail = [inc.proportion, inc.particleSize && `粒径${inc.particleSize}cm`, inc.sorting && `分选${inc.sorting}`, inc.roundness]
        .filter(Boolean).join('，');
      return detail ? `${inc.type}（${detail}）` : inc.type;
    })
    .join('；');
}

// 结构化标本 → 文本
export function composeSpecimensText(specimensJson: string): string {
  if (!specimensJson) return '';
  try {
    const arr = JSON.parse(specimensJson) as SpecimenRow[];
    return arr
      .filter(s => s.number || s.category)
      .map(s => s.number ? `${s.number}（${[s.category, s.quantity].filter(Boolean).join('，')}）` : [s.category, s.quantity].filter(Boolean).join('，'))
      .join('；');
  } catch { return ''; }
}

// 层包含物文本：结构化优先，旧文本列 fallback
export function layerInclusionsText(l: FeatureLayer): string {
  if (l.inclusions_json) {
    try {
      const text = composeInclusionsText(JSON.parse(l.inclusions_json) as InclusionRow[]);
      if (text) return text;
    } catch { /* ignore */ }
  }
  return l.inclusions || '';
}

// 由堆积层自动拼接「堆积层与包含物」文本
export function composeDepositText(layers: FeatureLayer[]): string {
  return layers
    .filter(l => l.layer_number || l.soil_color || layerInclusionsText(l))
    .map(l => {
      const parts = [`${l.layer_number}层`];
      if (l.soil_color) parts.push(l.soil_color);
      if (l.soil_texture) parts.push(l.soil_texture);
      if (l.density) parts.push(l.density);
      const base = parts.join('');
      let line = base;
      const inc = layerInclusionsText(l);
      if (inc) line += `，含${inc}`;
      if (l.thickness) line += `，厚约${l.thickness}`;
      const specimens = composeSpecimensText(l.specimens_json);
      if (specimens) line += `，标本：${specimens}`;
      if (l.soil_sample) line += `，土样：${l.soil_sample}`;
      if (l.upper_interface) line += `，上界面呈${l.upper_interface}`;
      if (l.lower_interface) line += `，下界面呈${l.lower_interface}`;
      const extra = [l.observation, l.remarks].filter(Boolean).join('；');
      if (extra) line += `（${extra}）`;
      return line + '。';
    })
    .join('\n');
}

// 由遗物自动拼接「遗物」文本
export function composeArtifactText(artifacts: FeatureArtifact[]): string {
  return artifacts
    .filter(a => a.type || a.number)
    .map(a => {
      const seg = [a.type, a.quantity].filter(Boolean).join('');
      return seg ? `${seg}：${a.number}` : a.number;
    })
    .join('\n');
}
