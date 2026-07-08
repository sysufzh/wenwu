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
}

export function getDiaries(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) {
  const db = getDb();
  const { page = 1, limit = 20, dateFrom, dateTo } = params;

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
    `INSERT INTO excavation_diaries (diary_date, weather, wind_direction, humidity, trench_number, recorder, content, created_at, updated_at)
     VALUES (@diary_date, @weather, @wind_direction, @humidity, @trench_number, @recorder, @content, @created_at, @updated_at)`
  );
  const result = stmt.run({
    diary_date: input.diary_date,
    weather: input.weather || '',
    wind_direction: input.wind_direction || '',
    humidity: input.humidity || '',
    trench_number: input.trench_number || '',
    recorder: input.recorder || '',
    content: input.content,
    created_at: now,
    updated_at: now,
  });
  return getDiaryById(result.lastInsertRowid as number)!;
}

export function deleteDiary(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM excavation_diaries WHERE id = ?').run(id);
  return result.changes > 0;
}
