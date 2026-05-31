import { getDb } from './index';

export interface CheckoutRecord {
  id: number;
  relic_id: number;
  checkout_time: string;
  checkout_person: string;
  purpose: string;
  created_at: string;
}

export interface CheckinRecord {
  id: number;
  relic_id: number;
  checkout_record_id: number;
  checkin_time: string;
  checkin_person: string;
  condition_notes: string;
  remarks: string;
  created_at: string;
}

export interface RelicHistory {
  relic: Record<string, unknown>;
  checkoutRecords: CheckoutRecord[];
  checkinRecords: CheckinRecord[];
}

export function getRelicHistory(relicId: number): RelicHistory {
  const db = getDb();
  const relic = db.prepare(
    'SELECT * FROM relics WHERE id = ?'
  ).get(relicId);

  const checkoutRecords = db.prepare(
    'SELECT * FROM checkout_records WHERE relic_id = ? ORDER BY checkout_time DESC'
  ).all(relicId) as CheckoutRecord[];

  const checkinRecords = db.prepare(
    'SELECT * FROM checkin_records WHERE relic_id = ? ORDER BY checkin_time DESC'
  ).all(relicId) as CheckinRecord[];

  return {
    relic: relic as any,
    checkoutRecords,
    checkinRecords,
  };
}

export function checkoutRelic(relicId: number, checkoutPerson: string, purpose?: string, checkoutTime?: string): CheckoutRecord {
  const db = getDb();
  const time = checkoutTime || new Date().toISOString();

  const result = db.prepare(
    `INSERT INTO checkout_records (relic_id, checkout_time, checkout_person, purpose)
     VALUES (@relic_id, @checkout_time, @checkout_person, @purpose)`
  ).run({
    relic_id: relicId,
    checkout_time: time,
    checkout_person: checkoutPerson,
    purpose: purpose || '',
  });

  db.prepare(
    "UPDATE relics SET status = '出库', updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(relicId);

  return db.prepare('SELECT * FROM checkout_records WHERE id = ?').get(result.lastInsertRowid) as CheckoutRecord;
}

export function checkinRelic(relicId: number, checkoutRecordId: number, checkinPerson: string, conditionNotes?: string, remarks?: string, checkinTime?: string): CheckinRecord {
  const db = getDb();
  const time = checkinTime || new Date().toISOString();

  const result = db.prepare(
    `INSERT INTO checkin_records (relic_id, checkout_record_id, checkin_time, checkin_person, condition_notes, remarks)
     VALUES (@relic_id, @checkout_record_id, @checkin_time, @checkin_person, @condition_notes, @remarks)`
  ).run({
    relic_id: relicId,
    checkout_record_id: checkoutRecordId,
    checkin_time: time,
    checkin_person: checkinPerson,
    condition_notes: conditionNotes || '',
    remarks: remarks || '',
  });

  db.prepare(
    "UPDATE relics SET status = '在库', updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(relicId);

  return db.prepare('SELECT * FROM checkin_records WHERE id = ?').get(result.lastInsertRowid) as CheckinRecord;
}

export interface RecordsListParams {
  type?: 'checkout' | 'checkin' | '';
  person?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function getRecords(params: RecordsListParams = {}) {
  const db = getDb();
  const { type, person, dateFrom, dateTo, page = 1, limit = 20 } = params;

  const offset = (page - 1) * limit;

  if (type === 'checkin') {
    return getCheckinRecords({ person, dateFrom, dateTo, page, limit, offset });
  }

  if (type === 'checkout') {
    return getCheckoutRecords({ person, dateFrom, dateTo, page, limit, offset });
  }

  // Combined - return both
  const checkouts = getCheckoutRecords({ person, dateFrom, dateTo, page, limit, offset });
  const checkins = getCheckinRecords({ person, dateFrom, dateTo, page, limit, offset });
  return {
    checkouts: checkouts.data,
    checkins: checkins.data,
    checkoutTotal: checkouts.total,
    checkinTotal: checkins.total,
  };
}

function getCheckoutRecords(params: { person?: string; dateFrom?: string; dateTo?: string; page: number; limit: number; offset: number }) {
  const db = getDb();
  const { person, dateFrom, dateTo, limit, offset } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (person) {
    where += ' AND cr.checkout_person LIKE @person';
    conditions['person'] = `%${person}%`;
  }
  if (dateFrom) {
    where += ' AND cr.checkout_time >= @dateFrom';
    conditions['dateFrom'] = dateFrom;
  }
  if (dateTo) {
    where += ' AND cr.checkout_time <= @dateTo';
    conditions['dateTo'] = dateTo;
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM checkout_records cr ${where}`
  ).get(conditions) as { total: number };

  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT cr.*, r.artifact_name, r.warehouse_number, r.shelf_number
     FROM checkout_records cr
     LEFT JOIN relics r ON cr.relic_id = r.id
     ${where}
     ORDER BY cr.checkout_time DESC LIMIT @limit OFFSET @offset`
  ).all(conditions);

  return { data: rows, total: countRow.total, page: params.page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

function getCheckinRecords(params: { person?: string; dateFrom?: string; dateTo?: string; page: number; limit: number; offset: number }) {
  const db = getDb();
  const { person, dateFrom, dateTo, limit, offset } = params;

  let where = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (person) {
    where += ' AND cir.checkin_person LIKE @person';
    conditions['person'] = `%${person}%`;
  }
  if (dateFrom) {
    where += ' AND cir.checkin_time >= @dateFrom';
    conditions['dateFrom'] = dateFrom;
  }
  if (dateTo) {
    where += ' AND cir.checkin_time <= @dateTo';
    conditions['dateTo'] = dateTo;
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM checkin_records cir ${where}`
  ).get(conditions) as { total: number };

  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT cir.*, r.artifact_name, r.warehouse_number, r.shelf_number,
            cr.checkout_time, cr.checkout_person
     FROM checkin_records cir
     LEFT JOIN relics r ON cir.relic_id = r.id
     LEFT JOIN checkout_records cr ON cir.checkout_record_id = cr.id
     ${where}
     ORDER BY cir.checkin_time DESC LIMIT @limit OFFSET @offset`
  ).all(conditions);

  return { data: rows, total: countRow.total, page: params.page, limit, totalPages: Math.ceil(countRow.total / limit) };
}

export function getRecentRecords(limit = 10) {
  const db = getDb();
  const checkouts = db.prepare(
    `SELECT cr.*, r.artifact_name, r.warehouse_number, 'checkout' as type
     FROM checkout_records cr LEFT JOIN relics r ON cr.relic_id = r.id
     ORDER BY cr.created_at DESC LIMIT ?`
  ).all(limit);

  const checkins = db.prepare(
    `SELECT cir.*, r.artifact_name, r.warehouse_number, 'checkin' as type
     FROM checkin_records cir LEFT JOIN relics r ON cir.relic_id = r.id
     ORDER BY cir.created_at DESC LIMIT ?`
  ).all(limit);

  return { checkouts, checkins };
}
