// ============================================================
// Database Schema & Initialization
// ============================================================

import { getDatabase } from './connection';

const SCHEMA_VERSION = 3;

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS work_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  work_type TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  rate REAL,
  amount REAL NOT NULL,
  description1 TEXT,
  description2 TEXT,
  khait_ka_naam TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  is_archived INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);
` + `
CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  is_archived INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_value_json TEXT,
  new_value_json TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS work_type_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_farmers_name ON farmers(name);
CREATE INDEX IF NOT EXISTS idx_farmers_village ON farmers(village);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_farmers_archived ON farmers(is_archived);

CREATE INDEX IF NOT EXISTS idx_work_entries_farmer_id ON work_entries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_work_entries_date ON work_entries(date);
CREATE INDEX IF NOT EXISTS idx_work_entries_archived ON work_entries(is_archived);
CREATE INDEX IF NOT EXISTS idx_work_entries_work_type ON work_entries(work_type);

CREATE INDEX IF NOT EXISTS idx_deposits_farmer_id ON deposits(farmer_id);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(date);
CREATE INDEX IF NOT EXISTS idx_deposits_archived ON deposits(is_archived);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
`;

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  // Run schema creation
  await db.execAsync(CREATE_TABLES);

  // Check and set schema version
  const versionRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  if (versionRows.length === 0) {
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
  } else {
    const currentVersion = versionRows[0].version;
    if (currentVersion < SCHEMA_VERSION) {
      await runMigrations(currentVersion, SCHEMA_VERSION);
    }
  }
}

async function runMigrations(fromVersion: number, toVersion: number): Promise<void> {
  const db = await getDatabase();

  if (fromVersion < 2) {
    // Add description1 and description2 columns to work_entries
    await db.execAsync(`
      ALTER TABLE work_entries ADD COLUMN description1 TEXT;
      ALTER TABLE work_entries ADD COLUMN description2 TEXT;
    `);
    // Create work_type_suggestions table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS work_type_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value TEXT NOT NULL UNIQUE,
        usage_count INTEGER NOT NULL DEFAULT 1,
        last_used_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `);
  }

  if (fromVersion < 3) {
    // Add khait_ka_naam column to work_entries
    await db.execAsync(`
      ALTER TABLE work_entries ADD COLUMN khait_ka_naam TEXT;
    `);
  }

  await db.runAsync('UPDATE schema_version SET version = ?', toVersion);
}
