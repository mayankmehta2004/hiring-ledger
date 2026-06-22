// ============================================================
// Backup & Restore Operations
// ============================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase, closeDatabase } from './connection';
import { APP_CONFIG } from '../constants/config';
import { DatabaseStats } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_BACKUP_KEY = 'last_backup_date';
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;

async function ensureBackupDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
}

export async function exportDatabaseBackup(): Promise<string> {
  await ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${APP_CONFIG.backupPrefix}_${timestamp}.db`;
  const destPath = `${BACKUP_DIR}${fileName}`;

  // The SQLite db file is stored in the document directory by expo-sqlite
  const dbPath = `${FileSystem.documentDirectory}SQLite/${APP_CONFIG.dbName}`;

  await FileSystem.copyAsync({
    from: dbPath,
    to: destPath,
  });

  // Record backup date
  await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

  // Share the file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destPath, {
      mimeType: 'application/x-sqlite3',
      dialogTitle: 'Export Database Backup',
    });
  }

  return destPath;
}

export async function exportJsonBackup(): Promise<string> {
  await ensureBackupDir();

  const db = await getDatabase();

  const farmers = await db.getAllAsync('SELECT * FROM farmers');
  const workEntries = await db.getAllAsync('SELECT * FROM work_entries');
  const deposits = await db.getAllAsync('SELECT * FROM deposits');
  const auditLogs = await db.getAllAsync('SELECT * FROM audit_logs');

  const backup = {
    version: APP_CONFIG.version,
    exportedAt: new Date().toISOString(),
    data: {
      farmers,
      work_entries: workEntries,
      deposits,
      audit_logs: auditLogs,
    },
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${APP_CONFIG.jsonBackupPrefix}_${timestamp}.json`;
  const destPath = `${BACKUP_DIR}${fileName}`;

  await FileSystem.writeAsStringAsync(destPath, JSON.stringify(backup, null, 2));

  // Record backup date
  await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destPath, {
      mimeType: 'application/json',
      dialogTitle: 'Export JSON Backup',
    });
  }

  return destPath;
}

export async function importDatabaseBackup(
  sourceUri: string
): Promise<boolean> {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/${APP_CONFIG.dbName}`;

    // Close existing connection
    await closeDatabase();

    // Create backup of current DB before overwriting
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const preRestoreBackup = `${BACKUP_DIR}pre_restore_${timestamp}.db`;
    await ensureBackupDir();

    const currentDbInfo = await FileSystem.getInfoAsync(dbPath);
    if (currentDbInfo.exists) {
      await FileSystem.copyAsync({
        from: dbPath,
        to: preRestoreBackup,
      });
    }

    // Copy the imported file to DB location
    await FileSystem.copyAsync({
      from: sourceUri,
      to: dbPath,
    });

    return true;
  } catch (error) {
    console.error('Failed to import database backup:', error);
    return false;
  }
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDatabase();

  const farmerCount = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM farmers'
  );
  const workCount = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM work_entries'
  );
  const depositCount = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM deposits'
  );
  const auditCount = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM audit_logs'
  );

  // Get DB file size
  const dbPath = `${FileSystem.documentDirectory}SQLite/${APP_CONFIG.dbName}`;
  const fileInfo = await FileSystem.getInfoAsync(dbPath);

  const lastBackup = await AsyncStorage.getItem(LAST_BACKUP_KEY);

  return {
    farmerCount: farmerCount?.c || 0,
    workEntryCount: workCount?.c || 0,
    depositCount: depositCount?.c || 0,
    auditLogCount: auditCount?.c || 0,
    dbSizeBytes: (fileInfo as any).size || 0,
    lastBackupDate: lastBackup,
  };
}

export async function getLastBackupDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_BACKUP_KEY);
}

export async function shouldShowBackupReminder(): Promise<boolean> {
  const lastBackup = await AsyncStorage.getItem(LAST_BACKUP_KEY);
  if (!lastBackup) return true;

  const lastDate = new Date(lastBackup);
  const now = new Date();
  const diffDays =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays >= APP_CONFIG.backupReminderDays;
}
