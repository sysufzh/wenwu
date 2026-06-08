import { getDb } from './index';

export interface VehicleUsage {
  id: number;
  usage_date: string;
  usage_time_start: string;
  usage_time_end: string;
  license_plate: string;
  user_name: string;
  purpose: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleUsageCreateInput {
  usage_date: string;
  usage_time_start?: string;
  usage_time_end?: string;
  license_plate: string;
  user_name?: string;
  purpose?: string;
  remarks?: string;
}

export interface VehicleUsageListParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function getVehicleUsages(params: VehicleUsageListParams = {}) {
  const db = getDb();
  const { search, dateFrom, dateTo, page = 1, limit = 20 } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    where += ' AND (license_plate LIKE @search OR user_name LIKE @search OR purpose LIKE @search)';
    conditions['search'] = `%${search}%`;
  }
  if (dateFrom) { where += ' AND usage_date >= @dateFrom'; conditions['dateFrom'] = dateFrom; }
  if (dateTo) { where += ' AND usage_date <= @dateTo'; conditions['dateTo'] = dateTo; }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM vehicle_usage ${where}`).get(conditions) as { total: number };
  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM vehicle_usage ${where} ORDER BY usage_date DESC, usage_time_start DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as VehicleUsage[];

  return { data: rows, total: countRow.total, page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

export function getVehicleUsageById(id: number): VehicleUsage | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM vehicle_usage WHERE id = ?').get(id) as VehicleUsage | undefined;
}

export function createVehicleUsage(input: VehicleUsageCreateInput): VehicleUsage {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO vehicle_usage (usage_date, usage_time_start, usage_time_end, license_plate, user_name, purpose, remarks, created_at, updated_at)
     VALUES (@usage_date, @usage_time_start, @usage_time_end, @license_plate, @user_name, @purpose, @remarks, @created_at, @updated_at)`
  ).run({
    usage_date: input.usage_date,
    usage_time_start: input.usage_time_start || '',
    usage_time_end: input.usage_time_end || '',
    license_plate: input.license_plate,
    user_name: input.user_name || '',
    purpose: input.purpose || '',
    remarks: input.remarks || '',
    created_at: now,
    updated_at: now,
  });
  return getVehicleUsageById(result.lastInsertRowid as number)!;
}

export function updateVehicleUsage(id: number, input: Partial<VehicleUsageCreateInput>): VehicleUsage | undefined {
  const db = getDb();
  const existing = getVehicleUsageById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE vehicle_usage SET usage_date=@usage_date, usage_time_start=@usage_time_start, usage_time_end=@usage_time_end, license_plate=@license_plate, user_name=@user_name, purpose=@purpose, remarks=@remarks, updated_at=@updated_at WHERE id=@id`
  ).run({
    id,
    usage_date: input.usage_date ?? existing.usage_date,
    usage_time_start: input.usage_time_start ?? existing.usage_time_start,
    usage_time_end: input.usage_time_end ?? existing.usage_time_end,
    license_plate: input.license_plate ?? existing.license_plate,
    user_name: input.user_name ?? existing.user_name,
    purpose: input.purpose ?? existing.purpose,
    remarks: input.remarks ?? existing.remarks,
    updated_at: now,
  });
  return getVehicleUsageById(id);
}

export function deleteVehicleUsage(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM vehicle_usage WHERE id = ?').run(id).changes > 0;
}
