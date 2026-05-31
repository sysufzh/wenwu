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

CREATE INDEX IF NOT EXISTS idx_relics_status ON relics(status);
CREATE INDEX IF NOT EXISTS idx_relics_artifact_name ON relics(artifact_name);
CREATE INDEX IF NOT EXISTS idx_checkout_records_relic_id ON checkout_records(relic_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_relic_id ON checkin_records(relic_id);
