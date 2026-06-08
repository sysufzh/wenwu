import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { seedTransactionCategories } from './transactions';

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
    seedUsers();
    seedTransactionCategories();
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
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c > 0) return;

  const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'admin', display_name: '管理员' },
    { username: 'user1', password: 'user123', role: 'user', display_name: '库管员1' },
    { username: 'user2', password: 'user123', role: 'user', display_name: '库管员2' },
    { username: 'user3', password: 'user123', role: 'user', display_name: '库管员3' },
  ];

  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, role, display_name) VALUES (@username, @password_hash, @role, @display_name)'
  );

  for (const u of defaultUsers) {
    const passwordHash = bcrypt.hashSync(u.password, 10);
    stmt.run({ username: u.username, password_hash: passwordHash, role: u.role, display_name: u.display_name });
  }
}

export { getDb, DB_PATH };
