import { getDb } from './index';

export interface SealUsage {
  id: number;
  usage_date: string;
  purpose: string;
  seal_count: number;
  user_name: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface SealUsageCreateInput {
  usage_date: string;
  purpose?: string;
  seal_count?: number;
  user_name?: string;
  remarks?: string;
}

export interface SealUsageListParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function getSealUsages(params: SealUsageListParams = {}) {
  const db = getDb();
  const { search, dateFrom, dateTo, page = 1, limit = 20 } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    where += ' AND (purpose LIKE @search OR user_name LIKE @search)';
    conditions['search'] = `%${search}%`;
  }
  if (dateFrom) { where += ' AND usage_date >= @dateFrom'; conditions['dateFrom'] = dateFrom; }
  if (dateTo) { where += ' AND usage_date <= @dateTo'; conditions['dateTo'] = dateTo; }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM seal_usage ${where}`).get(conditions) as { total: number };
  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM seal_usage ${where} ORDER BY usage_date DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as SealUsage[];

  return { data: rows, total: countRow.total, page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

export function getSealUsageById(id: number): SealUsage | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM seal_usage WHERE id = ?').get(id) as SealUsage | undefined;
}

export function createSealUsage(input: SealUsageCreateInput): SealUsage {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO seal_usage (usage_date, purpose, seal_count, user_name, remarks, created_at, updated_at)
     VALUES (@usage_date, @purpose, @seal_count, @user_name, @remarks, @created_at, @updated_at)`
  ).run({
    usage_date: input.usage_date,
    purpose: input.purpose || '',
    seal_count: input.seal_count ?? 1,
    user_name: input.user_name || '',
    remarks: input.remarks || '',
    created_at: now,
    updated_at: now,
  });
  return getSealUsageById(result.lastInsertRowid as number)!;
}

export function updateSealUsage(id: number, input: Partial<SealUsageCreateInput>): SealUsage | undefined {
  const db = getDb();
  const existing = getSealUsageById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE seal_usage SET usage_date=@usage_date, purpose=@purpose, seal_count=@seal_count, user_name=@user_name, remarks=@remarks, updated_at=@updated_at WHERE id=@id`
  ).run({
    id,
    usage_date: input.usage_date ?? existing.usage_date,
    purpose: input.purpose ?? existing.purpose,
    seal_count: input.seal_count ?? existing.seal_count,
    user_name: input.user_name ?? existing.user_name,
    remarks: input.remarks ?? existing.remarks,
    updated_at: now,
  });
  return getSealUsageById(id);
}

export function deleteSealUsage(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM seal_usage WHERE id = ?').run(id).changes > 0;
}
