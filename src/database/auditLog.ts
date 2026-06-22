// ============================================================
// Audit Log Operations
// ============================================================

import { getDatabase } from './connection';
import { AuditLog } from '../types';

export async function logAction(
  entityType: AuditLog['entity_type'],
  entityId: number,
  action: AuditLog['action'],
  oldValue: Record<string, unknown> | null = null,
  newValue: Record<string, unknown> | null = null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO audit_logs (entity_type, entity_id, action, old_value_json, new_value_json)
     VALUES (?, ?, ?, ?, ?)`,
    entityType,
    entityId,
    action,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null
  );
}

export async function getAuditLogs(
  entityType?: string,
  entityId?: number,
  limit: number = 50
): Promise<AuditLog[]> {
  const db = await getDatabase();

  let query = 'SELECT * FROM audit_logs';
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  if (entityType) {
    conditions.push('entity_type = ?');
    params.push(entityType);
  }
  if (entityId) {
    conditions.push('entity_id = ?');
    params.push(entityId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  return db.getAllAsync<AuditLog>(query, ...params);
}
