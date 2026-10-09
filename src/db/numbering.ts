import { getDb } from './index';

export const NUMBERING_CATEGORIES = [
  '灰坑',
  '灰沟',
  '墓葬',
  '柱洞',
  '房子',
  '灶',
  '烧土遗迹',
  '石块堆积',
] as const;

export const CATEGORY_PREFIX: Record<string, string> = {
  '灰坑': 'H',
  '灰沟': 'G',
  '墓葬': 'M',
  '柱洞': 'D',
  '房子': 'F',
  '灶': 'Z',
  '烧土遗迹': 'S',
  '石块堆积': 'SK',
};

export type NumberingStatus = '待审批' | '已通过' | '已驳回' | '占号' | '待销号' | '已销号';

export interface NumberingRequest {
  id: number;
  category: string;
  trench_number: string;
  position: string;
  shape: string;
  opening_size: string;
  soil_texture: string;
  soil_color: string;
  inclusions: string;
  stratigraphy: string;
  remarks: string;
  applicant: string;
  apply_date: string;
  status: NumberingStatus;
  assigned_number: string;
  reviewer: string;
  review_date: string;
  reject_reason: string;
  pre_cancel_status: string;
  created_at: string;
  updated_at: string;
}

export interface NumberingCreateInput {
  category: string;
  trench_number?: string;
  position?: string;
  shape?: string;
  opening_size?: string;
  soil_texture?: string;
  soil_color?: string;
  inclusions?: string;
  stratigraphy?: string;
  remarks?: string;
  applicant?: string;
}

export interface NumberingListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function getNumberingRequests(params: NumberingListParams = {}) {
  const db = getDb();
  const { search, status, page = 1, limit = 20 } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    where += ' AND (category LIKE @search OR trench_number LIKE @search OR position LIKE @search OR assigned_number LIKE @search OR applicant LIKE @search)';
    conditions['search'] = `%${search}%`;
  }
  if (status) { where += ' AND status = @status'; conditions['status'] = status; }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM numbering_requests ${where}`).get(conditions) as { total: number };
  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM numbering_requests ${where} ORDER BY id DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as NumberingRequest[];

  return { data: rows, total: countRow.total, page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

export function getNumberingRequestById(id: number): NumberingRequest | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM numbering_requests WHERE id = ?').get(id) as NumberingRequest | undefined;
}

export function createNumberingRequest(input: NumberingCreateInput): NumberingRequest {
  const db = getDb();
  const now = new Date().toISOString();
  const applyDate = new Date().toISOString().slice(0, 10);
  const result = db.prepare(
    `INSERT INTO numbering_requests (category, trench_number, position, shape, opening_size, soil_texture, soil_color, inclusions, stratigraphy, remarks, applicant, apply_date, status, created_at, updated_at)
     VALUES (@category, @trench_number, @position, @shape, @opening_size, @soil_texture, @soil_color, @inclusions, @stratigraphy, @remarks, @applicant, @apply_date, '待审批', @created_at, @updated_at)`
  ).run({
    category: input.category,
    trench_number: input.trench_number || '',
    position: input.position || '',
    shape: input.shape || '',
    opening_size: input.opening_size || '',
    soil_texture: input.soil_texture || '',
    soil_color: input.soil_color || '',
    inclusions: input.inclusions || '',
    stratigraphy: input.stratigraphy || '',
    remarks: input.remarks || '',
    applicant: input.applicant || '',
    apply_date: applyDate,
    created_at: now,
    updated_at: now,
  });
  return getNumberingRequestById(result.lastInsertRowid as number)!;
}

function allocateNumber(category: string): string {
  const db = getDb();
  const prefix = CATEGORY_PREFIX[category] || '';
  const rows = db.prepare(
    `SELECT assigned_number FROM numbering_requests WHERE category = ? AND assigned_number != ''`
  ).all(category) as { assigned_number: string }[];

  let max = 0;
  for (const r of rows) {
    const m = r.assigned_number.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
}

export function approveRequest(id: number, reviewer: string): NumberingRequest | undefined {
  const db = getDb();
  const approve = db.transaction(() => {
    const existing = getNumberingRequestById(id);
    if (!existing || existing.status !== '待审批') return undefined;

    const assigned = allocateNumber(existing.category);
    const now = new Date().toISOString();
    const reviewDate = new Date().toISOString().slice(0, 10);

    db.prepare(
      `UPDATE numbering_requests SET status='已通过', assigned_number=@assigned_number, reviewer=@reviewer, review_date=@review_date, updated_at=@updated_at WHERE id=@id`
    ).run({ id, assigned_number: assigned, reviewer, review_date: reviewDate, updated_at: now });

    return getNumberingRequestById(id);
  });
  return approve();
}

export function rejectRequest(id: number, reviewer: string, reason: string): NumberingRequest | undefined {
  const db = getDb();
  const existing = getNumberingRequestById(id);
  if (!existing || existing.status !== '待审批') return undefined;

  const now = new Date().toISOString();
  const reviewDate = new Date().toISOString().slice(0, 10);
  db.prepare(
    `UPDATE numbering_requests SET status='已驳回', reject_reason=@reject_reason, reviewer=@reviewer, review_date=@review_date, updated_at=@updated_at WHERE id=@id`
  ).run({ id, reject_reason: reason, reviewer, review_date: reviewDate, updated_at: now });

  return getNumberingRequestById(id);
}

export function applyCancel(id: number): NumberingRequest | undefined {
  const db = getDb();
  const existing = getNumberingRequestById(id);
  if (!existing || (existing.status !== '已通过' && existing.status !== '占号')) return undefined;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE numbering_requests SET status='待销号', pre_cancel_status=@pre, updated_at=@updated_at WHERE id=@id`
  ).run({ id, pre: existing.status, updated_at: now });

  return getNumberingRequestById(id);
}

export function approveCancel(id: number, reviewer: string): NumberingRequest | undefined {
  const db = getDb();
  const existing = getNumberingRequestById(id);
  if (!existing || existing.status !== '待销号') return undefined;

  const now = new Date().toISOString();
  const reviewDate = new Date().toISOString().slice(0, 10);
  db.prepare(
    `UPDATE numbering_requests SET status='已销号', reviewer=@reviewer, review_date=@review_date, updated_at=@updated_at WHERE id=@id`
  ).run({ id, reviewer, review_date: reviewDate, updated_at: now });

  return getNumberingRequestById(id);
}

export function rejectCancel(id: number): NumberingRequest | undefined {
  const db = getDb();
  const existing = getNumberingRequestById(id);
  if (!existing || existing.status !== '待销号') return undefined;

  const restore = existing.pre_cancel_status || '已通过';
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE numbering_requests SET status=@status, pre_cancel_status='', updated_at=@updated_at WHERE id=@id`
  ).run({ id, status: restore, updated_at: now });

  return getNumberingRequestById(id);
}

export function undoCancel(id: number): NumberingRequest | undefined {
  const db = getDb();
  const existing = getNumberingRequestById(id);
  if (!existing || existing.status !== '已销号') return undefined;

  const restore = existing.pre_cancel_status || '已通过';
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE numbering_requests SET status=@status, pre_cancel_status='', updated_at=@updated_at WHERE id=@id`
  ).run({ id, status: restore, updated_at: now });

  return getNumberingRequestById(id);
}

// admin 填写占号/已通过记录的信息；占号填写后转为已通过。
export function updateNumberingRequest(id: number, input: Partial<NumberingCreateInput>): NumberingRequest | undefined {
  const db = getDb();
  const existing = getNumberingRequestById(id);
  if (!existing || (existing.status !== '已通过' && existing.status !== '占号')) return undefined;

  const now = new Date().toISOString();
  const newStatus = existing.status === '占号' ? '已通过' : existing.status;
  db.prepare(
    `UPDATE numbering_requests SET trench_number=@trench_number, position=@position, shape=@shape, opening_size=@opening_size, soil_texture=@soil_texture, soil_color=@soil_color, inclusions=@inclusions, stratigraphy=@stratigraphy, remarks=@remarks, status=@status, updated_at=@updated_at WHERE id=@id`
  ).run({
    id,
    trench_number: input.trench_number ?? existing.trench_number,
    position: input.position ?? existing.position,
    shape: input.shape ?? existing.shape,
    opening_size: input.opening_size ?? existing.opening_size,
    soil_texture: input.soil_texture ?? existing.soil_texture,
    soil_color: input.soil_color ?? existing.soil_color,
    inclusions: input.inclusions ?? existing.inclusions,
    stratigraphy: input.stratigraphy ?? existing.stratigraphy,
    remarks: input.remarks ?? existing.remarks,
    status: newStatus,
    updated_at: now,
  });
  return getNumberingRequestById(id);
}

export function deleteNumberingRequest(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM numbering_requests WHERE id = ?').run(id).changes > 0;
}
