import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { seedTransactionCategories } from './transactions';
import { seedExcavation } from './seedExcavation';
import { seedNumberingPlaceholders } from './seedNumbering';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'wenwu.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    migrateSchema();
    migrateNumberingStatuses();
    seedUsers();
    seedTransactionCategories();
    seedExcavation();
    seedNumberingPlaceholders();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = path.join(process.cwd(), 'src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

function migrateSchema() {
  // Add columns that may not exist in older databases
  const migrations = [
    "ALTER TABLE transactions ADD COLUMN ledger_type TEXT DEFAULT '工作'",
    "ALTER TABLE transactions ADD COLUMN funding_source TEXT DEFAULT ''",
    "ALTER TABLE tools ADD COLUMN unit TEXT DEFAULT '件'",
    "ALTER TABLE vehicle_usage ADD COLUMN usage_time_start TEXT DEFAULT ''",
    "ALTER TABLE vehicle_usage ADD COLUMN usage_time_end TEXT DEFAULT ''",
    "ALTER TABLE transactions ADD COLUMN reimbursement_status TEXT DEFAULT '未报销'",
    "ALTER TABLE tool_checkout_records ADD COLUMN checkout_quantity INTEGER DEFAULT 1",
    "ALTER TABLE tool_checkin_records ADD COLUMN checkin_quantity INTEGER DEFAULT 1",
    "ALTER TABLE excavation_diaries ADD COLUMN wind_direction TEXT DEFAULT ''",
    "ALTER TABLE excavation_diaries ADD COLUMN humidity TEXT DEFAULT ''",
    "ALTER TABLE excavation_diaries ADD COLUMN feature_data TEXT DEFAULT ''",
    "ALTER TABLE excavation_features ADD COLUMN feature_type TEXT DEFAULT ''",
    "ALTER TABLE feature_layers ADD COLUMN inclusions_json TEXT DEFAULT ''",
    "ALTER TABLE feature_layers ADD COLUMN specimens_json TEXT DEFAULT ''",
    "ALTER TABLE feature_layers ADD COLUMN soil_sample TEXT DEFAULT ''",
    "ALTER TABLE feature_layers ADD COLUMN upper_interface TEXT DEFAULT ''",
    "ALTER TABLE feature_layers ADD COLUMN lower_interface TEXT DEFAULT ''",
    "ALTER TABLE feature_layers ADD COLUMN observation TEXT DEFAULT ''",
    "ALTER TABLE excavation_diaries ADD COLUMN temperature TEXT DEFAULT ''",
    "ALTER TABLE excavation_diaries ADD COLUMN workers TEXT DEFAULT ''",
    "ALTER TABLE excavation_diaries ADD COLUMN status TEXT DEFAULT '已保存'",
    "ALTER TABLE feature_artifacts ADD COLUMN name TEXT DEFAULT ''",
    "ALTER TABLE feature_artifacts ADD COLUMN description TEXT DEFAULT ''",
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }
}

// 给号系统状态从 3 种扩展到 6 种（新增占号/待销号/已销号 + pre_cancel_status），
// SQLite 不支持修改 CHECK 约束，需重建表（保留数据）。
function migrateNumberingStatuses() {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='numbering_requests'`).get() as { sql: string } | undefined;
  if (!row || row.sql.includes("'已销号'")) return;

  const rebuild = db.transaction(() => {
    db.exec('DROP INDEX IF EXISTS idx_numbering_requests_status');
    db.exec('DROP INDEX IF EXISTS idx_numbering_requests_category');
    db.exec('ALTER TABLE numbering_requests RENAME TO numbering_requests_old');
    db.exec(`CREATE TABLE numbering_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL DEFAULT '',
      trench_number TEXT DEFAULT '',
      position TEXT DEFAULT '',
      shape TEXT DEFAULT '',
      opening_size TEXT DEFAULT '',
      soil_texture TEXT DEFAULT '',
      soil_color TEXT DEFAULT '',
      inclusions TEXT DEFAULT '',
      stratigraphy TEXT DEFAULT '',
      remarks TEXT DEFAULT '',
      applicant TEXT DEFAULT '',
      apply_date TEXT DEFAULT '',
      status TEXT DEFAULT '待审批' CHECK(status IN ('待审批','已通过','已驳回','占号','待销号','已销号')),
      assigned_number TEXT DEFAULT '',
      reviewer TEXT DEFAULT '',
      review_date TEXT DEFAULT '',
      reject_reason TEXT DEFAULT '',
      pre_cancel_status TEXT DEFAULT '',
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime'))
    )`);
    db.exec(`INSERT INTO numbering_requests (
      id, category, trench_number, position, shape, opening_size, soil_texture, soil_color,
      inclusions, stratigraphy, remarks, applicant, apply_date, status, assigned_number,
      reviewer, review_date, reject_reason, pre_cancel_status, created_at, updated_at
    ) SELECT
      id, category, trench_number, position, shape, opening_size, soil_texture, soil_color,
      inclusions, stratigraphy, remarks, applicant, apply_date, status, assigned_number,
      reviewer, review_date, reject_reason, '', created_at, updated_at
    FROM numbering_requests_old`);
    db.exec('DROP TABLE numbering_requests_old');
    db.exec('CREATE INDEX IF NOT EXISTS idx_numbering_requests_status ON numbering_requests(status)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_numbering_requests_category ON numbering_requests(category)');
  });
  rebuild();
}

function seedUsers() {
  const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'admin', display_name: '管理员' },
    { username: 'user1', password: '12345678', role: 'user', display_name: '库管员1' },
    { username: 'user2', password: 'user123', role: 'user', display_name: '库管员2' },
    { username: 'user3', password: 'user123', role: 'user', display_name: '库管员3' },
    { username: 'user4', password: 'user123', role: 'user', display_name: '库管员4' },
    { username: 'user5', password: 'user123', role: 'user', display_name: '库管员5' },
    { username: 'user6', password: 'user123', role: 'user', display_name: '库管员6' },
    { username: 'user7', password: 'user123', role: 'user', display_name: '库管员7' },
    { username: 'user8', password: 'user123', role: 'user', display_name: '库管员8' },
    { username: 'user9', password: 'user123', role: 'user', display_name: '库管员9' },
    { username: 'user10', password: 'user123', role: 'user', display_name: '库管员10' },
    { username: 'user11', password: 'user123', role: 'user', display_name: '库管员11' },
  ];

  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, role, display_name) VALUES (@username, @password_hash, @role, @display_name)'
  );
  const exists = db.prepare('SELECT 1 FROM users WHERE username = ?');

  for (const u of defaultUsers) {
    if (exists.get(u.username)) continue;
    const passwordHash = bcrypt.hashSync(u.password, 10);
    stmt.run({ username: u.username, password_hash: passwordHash, role: u.role, display_name: u.display_name });
  }
}

export { getDb, DB_PATH };
