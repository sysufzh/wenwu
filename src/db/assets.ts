import { getDb } from './index';

export interface FixedAsset {
  id: number;
  asset_number: string;
  asset_name: string;
  quantity: number;
  brand: string;
  model_spec: string;
  production_date: string;
  entry_date: string;
  original_value: number;
  user_name: string;
  department: string;
  location: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface FixedAssetCreateInput {
  asset_number?: string;
  asset_name: string;
  quantity?: number;
  brand?: string;
  model_spec?: string;
  production_date?: string;
  entry_date?: string;
  original_value?: number;
  user_name?: string;
  department?: string;
  location?: string;
  remarks?: string;
}

export interface FixedAssetListParams {
  search?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export function getFixedAssets(params: FixedAssetListParams = {}) {
  const db = getDb();
  const { search, department, page = 1, limit = 20 } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    where += ' AND (asset_name LIKE @search OR asset_number LIKE @search OR brand LIKE @search OR user_name LIKE @search OR department LIKE @search)';
    conditions['search'] = `%${search}%`;
  }
  if (department) { where += ' AND department = @department'; conditions['department'] = department; }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM fixed_assets ${where}`).get(conditions) as { total: number };
  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM fixed_assets ${where} ORDER BY updated_at DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as FixedAsset[];

  return { data: rows, total: countRow.total, page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

export function getFixedAssetById(id: number): FixedAsset | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM fixed_assets WHERE id = ?').get(id) as FixedAsset | undefined;
}

export function createFixedAsset(input: FixedAssetCreateInput): FixedAsset {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO fixed_assets (asset_number, asset_name, quantity, brand, model_spec, production_date, entry_date, original_value, user_name, department, location, remarks, created_at, updated_at)
     VALUES (@asset_number, @asset_name, @quantity, @brand, @model_spec, @production_date, @entry_date, @original_value, @user_name, @department, @location, @remarks, @created_at, @updated_at)`
  ).run({
    asset_number: input.asset_number || '',
    asset_name: input.asset_name,
    quantity: input.quantity ?? 1,
    brand: input.brand || '',
    model_spec: input.model_spec || '',
    production_date: input.production_date || '',
    entry_date: input.entry_date || '',
    original_value: input.original_value ?? 0,
    user_name: input.user_name || '',
    department: input.department || '',
    location: input.location || '',
    remarks: input.remarks || '',
    created_at: now,
    updated_at: now,
  });
  return getFixedAssetById(result.lastInsertRowid as number)!;
}

export function updateFixedAsset(id: number, input: Partial<FixedAssetCreateInput>): FixedAsset | undefined {
  const db = getDb();
  const existing = getFixedAssetById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE fixed_assets SET asset_number=@asset_number, asset_name=@asset_name, quantity=@quantity, brand=@brand, model_spec=@model_spec, production_date=@production_date, entry_date=@entry_date, original_value=@original_value, user_name=@user_name, department=@department, location=@location, remarks=@remarks, updated_at=@updated_at WHERE id=@id`
  ).run({
    id,
    asset_number: input.asset_number ?? existing.asset_number,
    asset_name: input.asset_name ?? existing.asset_name,
    quantity: input.quantity ?? existing.quantity,
    brand: input.brand ?? existing.brand,
    model_spec: input.model_spec ?? existing.model_spec,
    production_date: input.production_date ?? existing.production_date,
    entry_date: input.entry_date ?? existing.entry_date,
    original_value: input.original_value ?? existing.original_value,
    user_name: input.user_name ?? existing.user_name,
    department: input.department ?? existing.department,
    location: input.location ?? existing.location,
    remarks: input.remarks ?? existing.remarks,
    updated_at: now,
  });
  return getFixedAssetById(id);
}

export function deleteFixedAsset(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM fixed_assets WHERE id = ?').run(id).changes > 0;
}
