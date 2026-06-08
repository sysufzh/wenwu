import { getDb } from './index';

export interface Transaction {
  id: number;
  transaction_date: string;
  type: '收入' | '支出';
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  handler: string;
  remarks: string;
  ledger_type: '生活' | '工作';
  funding_source: string;
  reimbursement_status: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreateInput {
  transaction_date: string;
  type: '收入' | '支出';
  category?: string;
  amount: number;
  description?: string;
  payment_method?: string;
  handler?: string;
  remarks?: string;
  ledger_type?: '生活' | '工作';
  funding_source?: string;
  reimbursement_status?: string;
}

export interface TransactionUpdateInput extends Partial<TransactionCreateInput> {}

export interface TransactionListParams {
  search?: string;
  type?: '收入' | '支出' | '';
  category?: string;
  ledgerType?: '生活' | '工作' | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function getTransactions(params: TransactionListParams = {}) {
  const db = getDb();
  const { search, type, category, ledgerType, dateFrom, dateTo, page = 1, limit = 20 } = params;

  let whereClause = 'WHERE 1=1';
  const conditions: Record<string, string | number> = {};

  if (search) {
    whereClause += ' AND (description LIKE @search OR handler LIKE @search OR category LIKE @search OR remarks LIKE @search)';
    conditions['search'] = `%${search}%`;
  }

  if (type) {
    whereClause += ' AND type = @type';
    conditions['type'] = type;
  }

  if (category) {
    whereClause += ' AND category = @category';
    conditions['category'] = category;
  }

  if (ledgerType) {
    whereClause += ' AND ledger_type = @ledgerType';
    conditions['ledgerType'] = ledgerType;
  }

  if (dateFrom) {
    whereClause += ' AND transaction_date >= @dateFrom';
    conditions['dateFrom'] = dateFrom;
  }

  if (dateTo) {
    whereClause += ' AND transaction_date <= @dateTo';
    conditions['dateTo'] = dateTo;
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM transactions ${whereClause}`).get(conditions) as { total: number };

  const offset = (page - 1) * limit;
  conditions['limit'] = limit;
  conditions['offset'] = offset;

  const rows = db.prepare(
    `SELECT * FROM transactions ${whereClause} ORDER BY transaction_date DESC, updated_at DESC LIMIT @limit OFFSET @offset`
  ).all(conditions) as Transaction[];

  return {
    data: rows,
    total: countRow.total,
    page,
    limit,
    totalPages: Math.ceil(countRow.total / limit),
  };
}

export function getTransactionById(id: number): Transaction | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | undefined;
}

export function createTransaction(input: TransactionCreateInput): Transaction {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO transactions (transaction_date, type, category, amount, description, payment_method, handler, remarks, ledger_type, funding_source, reimbursement_status, created_at, updated_at)
     VALUES (@transaction_date, @type, @category, @amount, @description, @payment_method, @handler, @remarks, @ledger_type, @funding_source, @reimbursement_status, @created_at, @updated_at)`
  );
  const result = stmt.run({
    transaction_date: input.transaction_date || '',
    type: input.type,
    category: input.category || '',
    amount: input.amount,
    description: input.description || '',
    payment_method: input.payment_method || '',
    handler: input.handler || '',
    remarks: input.remarks || '',
    ledger_type: input.ledger_type || '工作',
    funding_source: input.funding_source || '',
    reimbursement_status: input.reimbursement_status || '未报销',
    created_at: now,
    updated_at: now,
  });
  return getTransactionById(result.lastInsertRowid as number)!;
}

export function updateTransaction(id: number, input: TransactionUpdateInput): Transaction | undefined {
  const db = getDb();
  const existing = getTransactionById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `UPDATE transactions SET
      transaction_date = @transaction_date,
      type = @type,
      category = @category,
      amount = @amount,
      description = @description,
      payment_method = @payment_method,
      handler = @handler,
      remarks = @remarks,
      ledger_type = @ledger_type,
      funding_source = @funding_source,
      reimbursement_status = @reimbursement_status,
      updated_at = @updated_at
    WHERE id = @id`
  );
  stmt.run({
    id,
    transaction_date: input.transaction_date ?? existing.transaction_date,
    type: input.type ?? existing.type,
    category: input.category ?? existing.category,
    amount: input.amount ?? existing.amount,
    description: input.description ?? existing.description,
    payment_method: input.payment_method ?? existing.payment_method,
    handler: input.handler ?? existing.handler,
    remarks: input.remarks ?? existing.remarks,
    ledger_type: input.ledger_type ?? existing.ledger_type,
    funding_source: input.funding_source ?? existing.funding_source,
    reimbursement_status: input.reimbursement_status ?? existing.reimbursement_status,
    updated_at: now,
  });
  return getTransactionById(id);
}

export function deleteTransaction(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getTransactionStats(ledgerType?: '生活' | '工作') {
  const db = getDb();

  let typeFilter = '';
  const conditions: Record<string, string> = {};

  if (ledgerType) {
    typeFilter = ' AND ledger_type = @ledgerType';
    conditions['ledgerType'] = ledgerType;
  }

  const totalIncome = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = '收入'${typeFilter}`).get(conditions) as { total: number };
  const totalExpense = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = '支出'${typeFilter}`).get(conditions) as { total: number };

  const categoryBreakdown = db.prepare(
    `SELECT category, type, COALESCE(SUM(amount), 0) as total FROM transactions WHERE 1=1${typeFilter} GROUP BY type, category ORDER BY type, total DESC`
  ).all(conditions) as { category: string; type: string; total: number }[];

  return {
    totalIncome: totalIncome.total,
    totalExpense: totalExpense.total,
    balance: totalIncome.total - totalExpense.total,
    categoryBreakdown,
  };
}

export function getCategories(): { id: number; name: string; type: string; sort_order: number }[] {
  const db = getDb();
  return db.prepare('SELECT * FROM transaction_categories ORDER BY type, sort_order, id').all() as any[];
}

export function seedTransactionCategories() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM transaction_categories').get() as { c: number };
  if (count.c > 0) return;

  const categories = [
    // 工作支出
    { name: '办公费', type: '支出', sort_order: 1 },
    { name: '设备购置', type: '支出', sort_order: 2 },
    { name: '耗材费', type: '支出', sort_order: 3 },
    { name: '差旅费', type: '支出', sort_order: 4 },
    { name: '劳务费', type: '支出', sort_order: 5 },
    { name: '维修费', type: '支出', sort_order: 6 },
    { name: '运输费', type: '支出', sort_order: 7 },
    { name: '其他支出', type: '支出', sort_order: 8 },
    // 工作收入
    { name: '项目经费', type: '收入', sort_order: 1 },
    { name: '所拨经费', type: '收入', sort_order: 2 },
    { name: '其他收入', type: '收入', sort_order: 3 },
  ];

  const stmt = db.prepare('INSERT INTO transaction_categories (name, type, sort_order) VALUES (@name, @type, @sort_order)');
  for (const c of categories) {
    stmt.run(c);
  }
}
