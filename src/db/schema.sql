CREATE TABLE IF NOT EXISTS relics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_number TEXT DEFAULT '',
  shelf_number TEXT DEFAULT '',
  excavation_info TEXT DEFAULT '',
  artifact_name TEXT NOT NULL,
  material TEXT DEFAULT '',
  status TEXT DEFAULT '在库' CHECK(status IN ('在库', '出库')),
  other_info TEXT DEFAULT '',
  photo_path TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now', 'localtime')),
  updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS checkout_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relic_id INTEGER NOT NULL,
  checkout_time DATETIME DEFAULT (datetime('now', 'localtime')),
  checkout_person TEXT NOT NULL DEFAULT '',
  purpose TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (relic_id) REFERENCES relics(id)
);

CREATE TABLE IF NOT EXISTS checkin_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relic_id INTEGER NOT NULL,
  checkout_record_id INTEGER NOT NULL,
  checkin_time DATETIME DEFAULT (datetime('now', 'localtime')),
  checkin_person TEXT NOT NULL DEFAULT '',
  condition_notes TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (relic_id) REFERENCES relics(id),
  FOREIGN KEY (checkout_record_id) REFERENCES checkout_records(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  display_name TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_relics_status ON relics(status);
CREATE INDEX IF NOT EXISTS idx_relics_artifact_name ON relics(artifact_name);
CREATE INDEX IF NOT EXISTS idx_checkout_records_relic_id ON checkout_records(relic_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_relic_id ON checkin_records(relic_id);

-- 仓库工具管理
CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT DEFAULT '件',
  quantity INTEGER DEFAULT 1,
  warehouse_location TEXT DEFAULT '',
  status TEXT DEFAULT '在库' CHECK(status IN ('在库','出库')),
  responsible_person TEXT DEFAULT '',
  purchase_date TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  updated_at DATETIME DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS tool_checkout_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  checkout_time DATETIME DEFAULT (datetime('now','localtime')),
  checkout_person TEXT NOT NULL DEFAULT '',
  purpose TEXT DEFAULT '',
  checkout_quantity INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (tool_id) REFERENCES tools(id)
);

CREATE TABLE IF NOT EXISTS tool_checkin_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  checkout_record_id INTEGER NOT NULL,
  checkin_time DATETIME DEFAULT (datetime('now','localtime')),
  checkin_person TEXT NOT NULL DEFAULT '',
  condition_notes TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  checkin_quantity INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (tool_id) REFERENCES tools(id),
  FOREIGN KEY (checkout_record_id) REFERENCES tool_checkout_records(id)
);

CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tool_checkout_records_tool_id ON tool_checkout_records(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_checkin_records_tool_id ON tool_checkin_records(tool_id);

-- 记账
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_date TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '支出' CHECK(type IN ('收入','支出')),
  category TEXT DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  handler TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  ledger_type TEXT DEFAULT '工作' CHECK(ledger_type IN ('生活','工作')),
  funding_source TEXT DEFAULT '',
  reimbursement_status TEXT DEFAULT '未报销' CHECK(reimbursement_status IN ('已报销','未报销')),
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  updated_at DATETIME DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS transaction_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('收入','支出')),
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- 田野用车使用登记
CREATE TABLE IF NOT EXISTS vehicle_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usage_date TEXT NOT NULL DEFAULT '',
  usage_time_start TEXT DEFAULT '',
  usage_time_end TEXT DEFAULT '',
  license_plate TEXT NOT NULL DEFAULT '',
  user_name TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  updated_at DATETIME DEFAULT (datetime('now','localtime'))
);

-- 固定资产登记
CREATE TABLE IF NOT EXISTS fixed_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_number TEXT NOT NULL DEFAULT '',
  asset_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  brand TEXT DEFAULT '',
  model_spec TEXT DEFAULT '',
  production_date TEXT DEFAULT '',
  entry_date TEXT DEFAULT '',
  original_value REAL DEFAULT 0,
  user_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  updated_at DATETIME DEFAULT (datetime('now','localtime'))
);

-- 考古日记
CREATE TABLE IF NOT EXISTS excavation_diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diary_date TEXT NOT NULL DEFAULT '',
  weather TEXT DEFAULT '',
  wind_direction TEXT DEFAULT '',
  humidity TEXT DEFAULT '',
  trench_number TEXT DEFAULT '',
  recorder TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  updated_at DATETIME DEFAULT (datetime('now','localtime'))
);

-- 公章使用登记
CREATE TABLE IF NOT EXISTS seal_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usage_date TEXT NOT NULL DEFAULT '',
  purpose TEXT DEFAULT '',
  seal_count INTEGER DEFAULT 1,
  user_name TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  updated_at DATETIME DEFAULT (datetime('now','localtime'))
);
