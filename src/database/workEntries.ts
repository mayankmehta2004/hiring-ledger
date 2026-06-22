// ============================================================
// Work Entry CRUD Operations
// ============================================================

import { getDatabase } from './connection';
import { logAction } from './auditLog';
import { WorkEntry, WorkEntryInput, RecentActivity } from '../types';

export async function createWorkEntry(input: WorkEntryInput): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const workType = input.work_type?.trim() || input.description1?.trim() || input.description2?.trim() || 'Work';

  const result = await db.runAsync(
    `INSERT INTO work_entries (farmer_id, date, work_type, quantity, unit, rate, amount, description1, description2, khait_ka_naam, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.farmer_id,
    input.date,
    workType,
    input.quantity ?? null,
    input.unit ?? null,
    input.rate ?? null,
    input.amount,
    input.description1?.trim() || null,
    input.description2?.trim() || null,
    input.khait_ka_naam?.trim() || null,
    input.notes?.trim() || null,
    now,
    now
  );

  const entryId = result.lastInsertRowId;

  await logAction('work_entry', entryId, 'create', null, {
    ...input,
    work_type: workType,
    id: entryId,
  });

  return entryId;
}

export async function updateWorkEntry(
  id: number,
  input: Partial<WorkEntryInput>
): Promise<void> {
  const db = await getDatabase();

  const oldEntry = await db.getFirstAsync<WorkEntry>(
    'SELECT * FROM work_entries WHERE id = ?',
    id
  );

  if (!oldEntry) throw new Error(`Work entry not found: ${id}`);

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.farmer_id !== undefined) {
    updates.push('farmer_id = ?');
    values.push(input.farmer_id);
  }
  if (input.date !== undefined) {
    updates.push('date = ?');
    values.push(input.date);
  }
  if (input.work_type !== undefined) {
    updates.push('work_type = ?');
    values.push(input.work_type);
  }
  if (input.quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(input.quantity ?? null);
  }
  if (input.unit !== undefined) {
    updates.push('unit = ?');
    values.push(input.unit ?? null);
  }
  if (input.rate !== undefined) {
    updates.push('rate = ?');
    values.push(input.rate ?? null);
  }
  if (input.amount !== undefined) {
    updates.push('amount = ?');
    values.push(input.amount);
  }
  if (input.description1 !== undefined) {
    updates.push('description1 = ?');
    values.push(input.description1?.trim() || null);
  }
  if (input.description2 !== undefined) {
    updates.push('description2 = ?');
    values.push(input.description2?.trim() || null);
  }
  if (input.khait_ka_naam !== undefined) {
    updates.push('khait_ka_naam = ?');
    values.push(input.khait_ka_naam?.trim() || null);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes?.trim() || null);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE work_entries SET ${updates.join(', ')} WHERE id = ?`,
    ...values
  );

  await logAction('work_entry', id, 'update', oldEntry as unknown as Record<string, unknown>, {
    ...input,
  });
}

export async function archiveWorkEntry(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const oldEntry = await db.getFirstAsync<WorkEntry>(
    'SELECT * FROM work_entries WHERE id = ?',
    id
  );

  await db.runAsync(
    'UPDATE work_entries SET is_archived = 1, updated_at = ? WHERE id = ?',
    now,
    id
  );

  await logAction('work_entry', id, 'archive', oldEntry as unknown as Record<string, unknown>, {
    is_archived: 1,
  });
}

export async function restoreWorkEntry(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE work_entries SET is_archived = 0, updated_at = ? WHERE id = ?',
    now,
    id
  );

  await logAction('work_entry', id, 'restore', { is_archived: 1 }, { is_archived: 0 });
}

export async function deleteWorkEntry(id: number): Promise<void> {
  const db = await getDatabase();

  const oldEntry = await db.getFirstAsync<WorkEntry>(
    'SELECT * FROM work_entries WHERE id = ?',
    id
  );

  // Delete associated audit logs
  await db.runAsync(
    "DELETE FROM audit_logs WHERE entity_type = 'work_entry' AND entity_id = ?",
    id
  );

  // Permanently delete the work entry
  await db.runAsync('DELETE FROM work_entries WHERE id = ?', id);
}

export async function deleteAllWorkEntriesForFarmer(farmerId: number): Promise<void> {
  const db = await getDatabase();

  // Delete audit logs for all work entries of this farmer
  await db.runAsync(
    `DELETE FROM audit_logs WHERE entity_type = 'work_entry' AND entity_id IN
     (SELECT id FROM work_entries WHERE farmer_id = ?)`,
    farmerId
  );

  // Delete all work entries
  await db.runAsync('DELETE FROM work_entries WHERE farmer_id = ?', farmerId);
}

export async function getWorkEntriesForFarmer(
  farmerId: number,
  includeArchived: boolean = false
): Promise<WorkEntry[]> {
  const db = await getDatabase();
  const archivedClause = includeArchived ? '' : ' AND is_archived = 0';

  return db.getAllAsync<WorkEntry>(
    `SELECT * FROM work_entries
     WHERE farmer_id = ?${archivedClause}
     ORDER BY date DESC, created_at DESC`,
    farmerId
  );
}

export async function getTodayWorkTotal(): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM work_entries
     WHERE date = ? AND is_archived = 0`,
    today
  );

  return row?.total || 0;
}

export async function getMonthWorkTotal(
  month?: number,
  year?: number
): Promise<number> {
  const db = await getDatabase();
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? y + 1 : y;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM work_entries
     WHERE date >= ? AND date < ? AND is_archived = 0`,
    startDate,
    endDate
  );

  return row?.total || 0;
}

export async function getRecentActivity(
  limit: number = 20
): Promise<RecentActivity[]> {
  const db = await getDatabase();

  return db.getAllAsync<RecentActivity>(
    `SELECT
      w.id, 'work' as type, w.date, w.amount,
      w.work_type || CASE
        WHEN w.quantity IS NOT NULL AND w.unit IS NOT NULL
          THEN ' - ' || w.quantity || ' ' || w.unit
        ELSE ''
      END as description,
      f.name as farmer_name,
      f.id as farmer_id
    FROM work_entries w
    JOIN farmers f ON w.farmer_id = f.id
    WHERE w.is_archived = 0

    UNION ALL

    SELECT
      d.id, 'deposit' as type, d.date, d.amount,
      'Deposit' as description,
      f.name as farmer_name,
      f.id as farmer_id
    FROM deposits d
    JOIN farmers f ON d.farmer_id = f.id
    WHERE d.is_archived = 0

    ORDER BY date DESC, type ASC
    LIMIT ?`,
    limit
  );
}

export async function getTotalOutstandingBalance(): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT
      COALESCE(SUM(w_total), 0) - COALESCE(SUM(d_total), 0) as total
    FROM (
      SELECT
        f.id,
        (SELECT COALESCE(SUM(amount), 0) FROM work_entries WHERE farmer_id = f.id AND is_archived = 0) as w_total,
        (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE farmer_id = f.id AND is_archived = 0) as d_total
      FROM farmers f
      WHERE f.is_archived = 0
    )`
  );

  return row?.total || 0;
}
