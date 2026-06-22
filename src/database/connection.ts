// ============================================================
// SQLite Connection Singleton
// ============================================================

import * as SQLite from 'expo-sqlite';
import { APP_CONFIG } from '../constants/config';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(APP_CONFIG.dbName);

  // Enable WAL mode for better performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
