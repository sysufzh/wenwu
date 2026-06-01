import { getDb } from './index';

export interface Relic {
  id: number;
  warehouse_number: string;
  shelf_number: string;
  excavation_info: string;
  artifact_name: string;
  material: string;
  status: '在库' | '出库';
  other_info: string;
  photo_path: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface RelicCreateInput {
  warehouse_number?: string;
  shelf_number?: string;
  excavation_info?: string;
  artifact_name: string;
  material?: string;
  other_info?: string;
  photo_path?: string;
  remarks?: string;
}

export interface RelicUpdateInput extends Partial<RelicCreateInput> {}

export interface RelicListParams {
  search?: string;
  status?: '在库' | '出库' | '';
  page?: number;
  limit?: number;
}

export function getRelics(params: RelicListParams = {}) {
  const db = getDb();
  const { search, status, page = 1, limit = 20 } = params;

  let whereClause = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    whereClause += ' AND (artifact_name LIKE @search OR excavation_info LIKE @search OR warehouse_number LIKE @search OR shelf_number LIKE @search OR material LIKE @search)';
    conditions['search'] = `%${search}%`;
  }

  if (status) {
    whereClause += ' AND status = @status';
    conditions['status'] = status;
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM relics ${whereClause}`).get(conditions) as { total: number };

  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM relics ${whereClause} ORDER BY updated_at DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as Relic[];

  return {
    data: rows,
    total: countRow.total,
    page,
    limit,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

export function getRelicById(id: number): Relic | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM relics WHERE id = ?').get(id) as Relic | undefined;
}

export function createRelic(input: RelicCreateInput): Relic {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO relics (warehouse_number, shelf_number, excavation_info, artifact_name, material, other_info, photo_path, remarks, created_at, updated_at)
     VALUES (@warehouse_number, @shelf_number, @excavation_info, @artifact_name, @material, @other_info, @photo_path, @remarks, @created_at, @updated_at)`
  );
  const result = stmt.run({
    warehouse_number: input.warehouse_number || '',
    shelf_number: input.shelf_number || '',
    excavation_info: input.excavation_info || '',
    artifact_name: input.artifact_name,
    material: input.material || '',
    other_info: input.other_info || '',
    photo_path: input.photo_path || '',
    remarks: input.remarks || '',
    created_at: now,
    updated_at: now,
  });
  return getRelicById(result.lastInsertRowid as number)!;
}

export function updateRelic(id: number, input: RelicUpdateInput): Relic | undefined {
  const db = getDb();
  const existing = getRelicById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `UPDATE relics SET
      warehouse_number = @warehouse_number,
      shelf_number = @shelf_number,
      excavation_info = @excavation_info,
      artifact_name = @artifact_name,
      material = @material,
      other_info = @other_info,
      photo_path = @photo_path,
      remarks = @remarks,
      updated_at = @updated_at
    WHERE id = @id`
  );
  stmt.run({
    id,
    warehouse_number: input.warehouse_number ?? existing.warehouse_number,
    shelf_number: input.shelf_number ?? existing.shelf_number,
    excavation_info: input.excavation_info ?? existing.excavation_info,
    artifact_name: input.artifact_name ?? existing.artifact_name,
    material: input.material ?? existing.material,
    other_info: input.other_info ?? existing.other_info,
    photo_path: input.photo_path ?? existing.photo_path,
    remarks: input.remarks ?? existing.remarks,
    updated_at: now,
  });
  return getRelicById(id);
}

export function deleteRelic(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM relics WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateRelicStatus(id: number, status: '在库' | '出库'): void {
  const db = getDb();
  db.prepare('UPDATE relics SET status = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(status, id);
}

export function getDistinctFieldValues() {
  const db = getDb();
  const warehouseNumbers = db.prepare(
    "SELECT DISTINCT warehouse_number FROM relics WHERE warehouse_number != '' ORDER BY warehouse_number"
  ).all() as { warehouse_number: string }[];
  const shelfNumbers = db.prepare(
    "SELECT DISTINCT shelf_number FROM relics WHERE shelf_number != '' ORDER BY shelf_number"
  ).all() as { shelf_number: string }[];
  const materials = db.prepare(
    "SELECT DISTINCT material FROM relics WHERE material != '' ORDER BY material"
  ).all() as { material: string }[];

  return {
    warehouseNumbers: warehouseNumbers.map(r => r.warehouse_number),
    shelfNumbers: shelfNumbers.map(r => r.shelf_number),
    materials: materials.map(r => r.material),
  };
}

export function getLastRelic(): Relic | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM relics ORDER BY id DESC LIMIT 1').get() as Relic | undefined;
}

export function getRelicStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM relics').get() as { count: number };
  const inStock = db.prepare("SELECT COUNT(*) as count FROM relics WHERE status = '在库'").get() as { count: number };
  const outStock = db.prepare("SELECT COUNT(*) as count FROM relics WHERE status = '出库'").get() as { count: number };
  return {
    total: total.count,
    inStock: inStock.count,
    outStock: outStock.count,
  };
}
