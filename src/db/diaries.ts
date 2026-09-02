import { getDb } from './index';

export interface ExcavationDiary {
  id: number;
  diary_date: string;
  weather: string;
  wind_direction: string;
  humidity: string;
  trench_number: string;
  recorder: string;
  content: string;
  feature_data: string;
  created_at: string;
  updated_at: string;
}

export interface DiaryCreateInput {
  diary_date: string;
  weather?: string;
  wind_direction?: string;
  humidity?: string;
  trench_number?: string;
  recorder?: string;
  content: string;
  feature_data?: string;
}

export function getDiaries(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string; trench_number?: string } = {}) {
  const db = getDb();
  const { page = 1, limit = 20, dateFrom, dateTo, trench_number } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (dateFrom) {
    where += ' AND diary_date >= @dateFrom';
    conditions['dateFrom'] = dateFrom;
  }
  if (dateTo) {
    where += ' AND diary_date <= @dateTo';
    conditions['dateTo'] = dateTo;
  }
  if (trench_number) {
    where += ' AND trench_number = @trench_number';
    conditions['trench_number'] = trench_number;
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM excavation_diaries ${where}`).get(conditions) as { total: number };
  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM excavation_diaries ${where} ORDER BY diary_date DESC, created_at DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as ExcavationDiary[];

  return {
    data: rows,
    total: countRow.total,
    page,
    limit,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

export function getDiaryById(id: number): ExcavationDiary | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM excavation_diaries WHERE id = ?').get(id) as ExcavationDiary | undefined;
}

export function createDiary(input: DiaryCreateInput): ExcavationDiary {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO excavation_diaries (diary_date, weather, wind_direction, humidity, trench_number, recorder, content, feature_data, created_at, updated_at)
     VALUES (@diary_date, @weather, @wind_direction, @humidity, @trench_number, @recorder, @content, @feature_data, @created_at, @updated_at)`
  );
  const result = stmt.run({
    diary_date: input.diary_date,
    weather: input.weather || '',
    wind_direction: input.wind_direction || '',
    humidity: input.humidity || '',
    trench_number: input.trench_number || '',
    recorder: input.recorder || '',
    content: input.content,
    feature_data: input.feature_data || '',
    created_at: now,
    updated_at: now,
  });
  return getDiaryById(result.lastInsertRowid as number)!;
}

export function updateDiary(id: number, input: DiaryCreateInput): ExcavationDiary | undefined {
  const db = getDb();
  const existing = getDiaryById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE excavation_diaries SET
      diary_date = @diary_date, weather = @weather, wind_direction = @wind_direction,
      humidity = @humidity, trench_number = @trench_number, recorder = @recorder,
      content = @content, updated_at = @updated_at
     WHERE id = @id`
  ).run({
    id,
    diary_date: input.diary_date ?? existing.diary_date,
    weather: input.weather ?? existing.weather,
    wind_direction: input.wind_direction ?? existing.wind_direction,
    humidity: input.humidity ?? existing.humidity,
    trench_number: input.trench_number ?? existing.trench_number,
    recorder: input.recorder ?? existing.recorder,
    content: input.content ?? existing.content,
    updated_at: now,
  });
  return getDiaryById(id);
}

export function deleteDiary(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM excavation_diaries WHERE id = ?').run(id);
  return result.changes > 0;
}

// 去重探方号列表（用于日记页左侧筛选栏）
export function getTrenchNumbers(): string[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT DISTINCT trench_number FROM excavation_diaries WHERE trench_number != '' ORDER BY trench_number`
  ).all() as { trench_number: string }[];
  return rows.map(r => r.trench_number);
}

// 按遗迹号取回相关日记（LIKE 粗筛 + JS 精筛 feature_data 里的 feature_number）
export function getDiariesByFeatureNumber(featureNumber: string): ExcavationDiary[] {
  if (!featureNumber) return [];
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM excavation_diaries WHERE feature_data LIKE ? ORDER BY diary_date ASC, id ASC`
  ).all(`%${featureNumber}%`) as ExcavationDiary[];

  return rows.filter(d => {
    try {
      const data = JSON.parse(d.feature_data || '{}');
      const panels = Array.isArray(data.feature_panels) ? data.feature_panels : [];
      return panels.some((fp: { feature_number?: string }) => fp.feature_number === featureNumber);
    } catch {
      return false;
    }
  });
}
