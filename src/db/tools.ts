import { getDb } from './index';

export interface Tool {
  id: number;
  tool_name: string;
  category: string;
  unit: string;
  quantity: number;
  warehouse_location: string;
  status: '在库' | '出库';
  responsible_person: string;
  purchase_date: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface ToolCreateInput {
  tool_name: string;
  category?: string;
  unit?: string;
  quantity?: number;
  warehouse_location?: string;
  responsible_person?: string;
  purchase_date?: string;
  remarks?: string;
}

export interface ToolUpdateInput extends Partial<ToolCreateInput> {}

export interface ToolListParams {
  search?: string;
  status?: '在库' | '出库' | '';
  page?: number;
  limit?: number;
}

export function getTools(params: ToolListParams = {}) {
  const db = getDb();
  const { search, status, page = 1, limit = 20 } = params;

  let whereClause = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    whereClause += ' AND (tool_name LIKE @search OR category LIKE @search OR warehouse_location LIKE @search OR responsible_person LIKE @search)';
    conditions['search'] = `%${search}%`;
  }

  if (status) {
    whereClause += ' AND status = @status';
    conditions['status'] = status;
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM tools ${whereClause}`).get(conditions) as { total: number };

  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM tools ${whereClause} ORDER BY updated_at DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as Tool[];

  return {
    data: rows,
    total: countRow.total,
    page,
    limit,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

export function getToolById(id: number): Tool | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as Tool | undefined;
}

export function createTool(input: ToolCreateInput): Tool {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO tools (tool_name, category, unit, quantity, warehouse_location, responsible_person, purchase_date, remarks, created_at, updated_at)
     VALUES (@tool_name, @category, @unit, @quantity, @warehouse_location, @responsible_person, @purchase_date, @remarks, @created_at, @updated_at)`
  );
  const result = stmt.run({
    tool_name: input.tool_name,
    category: input.category || '',
    unit: input.unit || '件',
    quantity: input.quantity ?? 1,
    warehouse_location: input.warehouse_location || '',
    responsible_person: input.responsible_person || '',
    purchase_date: input.purchase_date || '',
    remarks: input.remarks || '',
    created_at: now,
    updated_at: now,
  });
  return getToolById(result.lastInsertRowid as number)!;
}

export function updateTool(id: number, input: ToolUpdateInput): Tool | undefined {
  const db = getDb();
  const existing = getToolById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `UPDATE tools SET
      tool_name = @tool_name,
      category = @category,
      unit = @unit,
      quantity = @quantity,
      warehouse_location = @warehouse_location,
      responsible_person = @responsible_person,
      purchase_date = @purchase_date,
      remarks = @remarks,
      updated_at = @updated_at
    WHERE id = @id`
  );
  stmt.run({
    id,
    tool_name: input.tool_name ?? existing.tool_name,
    category: input.category ?? existing.category,
    unit: input.unit ?? existing.unit,
    quantity: input.quantity ?? existing.quantity,
    warehouse_location: input.warehouse_location ?? existing.warehouse_location,
    responsible_person: input.responsible_person ?? existing.responsible_person,
    purchase_date: input.purchase_date ?? existing.purchase_date,
    remarks: input.remarks ?? existing.remarks,
    updated_at: now,
  });
  return getToolById(id);
}

export function deleteTool(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tools WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateToolStatus(id: number, status: '在库' | '出库'): void {
  const db = getDb();
  db.prepare("UPDATE tools SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(status, id);
}

export function getToolStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number };
  const inStock = db.prepare("SELECT COUNT(*) as count FROM tools WHERE status = '在库'").get() as { count: number };
  const outStock = db.prepare("SELECT COUNT(*) as count FROM tools WHERE status = '出库'").get() as { count: number };
  return {
    total: total.count,
    inStock: inStock.count,
    outStock: outStock.count,
  };
}

// Tool checkout/checkin records
export interface ToolCheckoutRecord {
  id: number;
  tool_id: number;
  checkout_time: string;
  checkout_person: string;
  purpose: string;
  checkout_quantity: number;
  created_at: string;
}

export interface ToolCheckinRecord {
  id: number;
  tool_id: number;
  checkout_record_id: number;
  checkin_time: string;
  checkin_person: string;
  condition_notes: string;
  remarks: string;
  checkin_quantity: number;
  created_at: string;
}

export function checkoutTool(toolId: number, checkoutPerson: string, purpose?: string, checkoutTime?: string, checkoutQuantity?: number): ToolCheckoutRecord {
  const db = getDb();
  const time = checkoutTime || new Date().toISOString();
  const qty = checkoutQuantity ?? 1;

  const result = db.prepare(
    `INSERT INTO tool_checkout_records (tool_id, checkout_time, checkout_person, purpose, checkout_quantity)
     VALUES (@tool_id, @checkout_time, @checkout_person, @purpose, @checkout_quantity)`
  ).run({
    tool_id: toolId,
    checkout_time: time,
    checkout_person: checkoutPerson,
    purpose: purpose || '',
    checkout_quantity: qty,
  });

  const tool = db.prepare('SELECT quantity FROM tools WHERE id = ?').get(toolId) as { quantity: number };
  const remaining = tool.quantity - qty;
  db.prepare(
    "UPDATE tools SET quantity = ?, status = CASE WHEN ? <= 0 THEN '出库' ELSE '在库' END, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(remaining, remaining, toolId);

  return db.prepare('SELECT * FROM tool_checkout_records WHERE id = ?').get(result.lastInsertRowid) as ToolCheckoutRecord;
}

export function checkinTool(toolId: number, checkoutRecordId: number, checkinPerson: string, conditionNotes?: string, remarks?: string, checkinTime?: string, checkinQuantity?: number): ToolCheckinRecord {
  const db = getDb();
  const time = checkinTime || new Date().toISOString();
  const qty = checkinQuantity ?? 1;

  const result = db.prepare(
    `INSERT INTO tool_checkin_records (tool_id, checkout_record_id, checkin_time, checkin_person, condition_notes, remarks, checkin_quantity)
     VALUES (@tool_id, @checkout_record_id, @checkin_time, @checkin_person, @condition_notes, @remarks, @checkin_quantity)`
  ).run({
    tool_id: toolId,
    checkout_record_id: checkoutRecordId,
    checkin_time: time,
    checkin_person: checkinPerson,
    condition_notes: conditionNotes || '',
    remarks: remarks || '',
    checkin_quantity: qty,
  });

  const tool = db.prepare('SELECT quantity FROM tools WHERE id = ?').get(toolId) as { quantity: number };
  const newQty = tool.quantity + qty;
  db.prepare(
    "UPDATE tools SET quantity = ?, status = '在库', updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(newQty, toolId);

  return db.prepare('SELECT * FROM tool_checkin_records WHERE id = ?').get(result.lastInsertRowid) as ToolCheckinRecord;
}

export function getToolHistory(toolId: number) {
  const db = getDb();
  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(toolId);
  const checkoutRecords = db.prepare(
    'SELECT * FROM tool_checkout_records WHERE tool_id = ? ORDER BY checkout_time DESC'
  ).all(toolId) as ToolCheckoutRecord[];
  const checkinRecords = db.prepare(
    'SELECT * FROM tool_checkin_records WHERE tool_id = ? ORDER BY checkin_time DESC'
  ).all(toolId) as ToolCheckinRecord[];

  return { tool, checkoutRecords, checkinRecords };
}

export function getToolRecords(params: { type?: 'checkout' | 'checkin' | ''; person?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
  const db = getDb();
  const { type, person, dateFrom, dateTo, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  if (type === 'checkout') return getToolCheckoutRecords({ person, dateFrom, dateTo, page, limit, offset });
  if (type === 'checkin') return getToolCheckinRecords({ person, dateFrom, dateTo, page, limit, offset });

  const checkouts = getToolCheckoutRecords({ person, dateFrom, dateTo, page, limit, offset });
  const checkins = getToolCheckinRecords({ person, dateFrom, dateTo, page, limit, offset });
  return {
    checkouts: checkouts.data,
    checkins: checkins.data,
    checkoutTotal: checkouts.total,
    checkinTotal: checkins.total,
  };
}

function getToolCheckoutRecords(params: { person?: string; dateFrom?: string; dateTo?: string; page: number; limit: number; offset: number }) {
  const db = getDb();
  const { person, dateFrom, dateTo, limit, offset } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (person) {
    where += ' AND tcr.checkout_person LIKE @person';
    conditions['person'] = `%${person}%`;
  }
  if (dateFrom) {
    where += ' AND tcr.checkout_time >= @dateFrom';
    conditions['dateFrom'] = dateFrom;
  }
  if (dateTo) {
    where += ' AND tcr.checkout_time <= @dateTo';
    conditions['dateTo'] = dateTo;
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM tool_checkout_records tcr ${where}`
  ).get(conditions) as { total: number };

  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT tcr.*, t.tool_name, t.category, t.warehouse_location
     FROM tool_checkout_records tcr
     LEFT JOIN tools t ON tcr.tool_id = t.id
     ${where}
     ORDER BY tcr.checkout_time DESC LIMIT @limit OFFSET @offset`
  ).all(conditions);

  return { data: rows, total: countRow.total, page: params.page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

function getToolCheckinRecords(params: { person?: string; dateFrom?: string; dateTo?: string; page: number; limit: number; offset: number }) {
  const db = getDb();
  const { person, dateFrom, dateTo, limit, offset } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (person) {
    where += ' AND tcir.checkin_person LIKE @person';
    conditions['person'] = `%${person}%`;
  }
  if (dateFrom) {
    where += ' AND tcir.checkin_time >= @dateFrom';
    conditions['dateFrom'] = dateFrom;
  }
  if (dateTo) {
    where += ' AND tcir.checkin_time <= @dateTo';
    conditions['dateTo'] = dateTo;
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM tool_checkin_records tcir ${where}`
  ).get(conditions) as { total: number };

  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT tcir.*, t.tool_name, t.category, t.warehouse_location,
            tcr.checkout_time, tcr.checkout_person
     FROM tool_checkin_records tcir
     LEFT JOIN tools t ON tcir.tool_id = t.id
     LEFT JOIN tool_checkout_records tcr ON tcir.checkout_record_id = tcr.id
     ${where}
     ORDER BY tcir.checkin_time DESC LIMIT @limit OFFSET @offset`
  ).all(conditions);

  return { data: rows, total: countRow.total, page: params.page, limit, totalPages: Math.ceil(countRow.total / limit) };
}
