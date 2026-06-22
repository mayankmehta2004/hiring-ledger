// ============================================================
// Farmer CRUD Operations
// ============================================================

import { getDatabase } from './connection';
import { logAction } from './auditLog';
import {
  Farmer,
  FarmerInput,
  FarmerWithBalance,
  FarmerFilters,
} from '../types';

// Generate a simple UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createFarmer(input: FarmerInput): Promise<number> {
  const db = await getDatabase();
  const uuid = generateUUID();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO farmers (uuid, name, phone, village, address, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    uuid,
    input.name.trim(),
    input.phone?.trim() || null,
    input.village?.trim() || null,
    input.address?.trim() || null,
    input.notes?.trim() || null,
    now,
    now
  );

  const farmerId = result.lastInsertRowId;

  await logAction('farmer', farmerId, 'create', null, {
    ...input,
    uuid,
    id: farmerId,
  });

  return farmerId;
}

export async function updateFarmer(
  id: number,
  input: Partial<FarmerInput>
): Promise<void> {
  const db = await getDatabase();

  // Get old values for audit
  const oldFarmer = await db.getFirstAsync<Farmer>(
    'SELECT * FROM farmers WHERE id = ?',
    id
  );

  if (!oldFarmer) throw new Error(`Farmer not found: ${id}`);

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name.trim());
  }
  if (input.phone !== undefined) {
    updates.push('phone = ?');
    values.push(input.phone?.trim() || null);
  }
  if (input.village !== undefined) {
    updates.push('village = ?');
    values.push(input.village?.trim() || null);
  }
  if (input.address !== undefined) {
    updates.push('address = ?');
    values.push(input.address?.trim() || null);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes?.trim() || null);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id.toString());

  await db.runAsync(
    `UPDATE farmers SET ${updates.join(', ')} WHERE id = ?`,
    ...values
  );

  await logAction('farmer', id, 'update', oldFarmer as unknown as Record<string, unknown>, {
    ...input,
  });
}

export async function archiveFarmer(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const oldFarmer = await db.getFirstAsync<Farmer>(
    'SELECT * FROM farmers WHERE id = ?',
    id
  );

  await db.runAsync(
    'UPDATE farmers SET is_archived = 1, updated_at = ? WHERE id = ?',
    now,
    id
  );

  await logAction('farmer', id, 'archive', oldFarmer as unknown as Record<string, unknown>, {
    is_archived: 1,
  });
}

export async function restoreFarmer(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE farmers SET is_archived = 0, updated_at = ? WHERE id = ?',
    now,
    id
  );

  await logAction('farmer', id, 'restore', { is_archived: 1 }, { is_archived: 0 });
}

export async function deleteFarmerPermanently(id: number): Promise<void> {
  const db = await getDatabase();

  // Delete all audit logs for this farmer's work entries
  await db.runAsync(
    `DELETE FROM audit_logs WHERE entity_type = 'work_entry' AND entity_id IN
     (SELECT id FROM work_entries WHERE farmer_id = ?)`,
    id
  );

  // Delete all audit logs for this farmer's deposits
  await db.runAsync(
    `DELETE FROM audit_logs WHERE entity_type = 'deposit' AND entity_id IN
     (SELECT id FROM deposits WHERE farmer_id = ?)`,
    id
  );

  // Delete farmer's audit logs
  await db.runAsync(
    "DELETE FROM audit_logs WHERE entity_type = 'farmer' AND entity_id = ?",
    id
  );

  // Delete all work entries
  await db.runAsync('DELETE FROM work_entries WHERE farmer_id = ?', id);

  // Delete all deposits
  await db.runAsync('DELETE FROM deposits WHERE farmer_id = ?', id);

  // Delete the farmer
  await db.runAsync('DELETE FROM farmers WHERE id = ?', id);
}

export async function getFarmer(id: number): Promise<FarmerWithBalance | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<FarmerWithBalance>(
    `SELECT
      f.*,
      COALESCE(w.total_work, 0) as total_work,
      COALESCE(d.total_deposits, 0) as total_deposits,
      COALESCE(w.total_work, 0) - COALESCE(d.total_deposits, 0) as outstanding_balance,
      COALESCE(w.work_count, 0) as work_count,
      COALESCE(d.deposit_count, 0) as deposit_count
    FROM farmers f
    LEFT JOIN (
      SELECT farmer_id, SUM(amount) as total_work, COUNT(*) as work_count
      FROM work_entries WHERE is_archived = 0
      GROUP BY farmer_id
    ) w ON f.id = w.farmer_id
    LEFT JOIN (
      SELECT farmer_id, SUM(amount) as total_deposits, COUNT(*) as deposit_count
      FROM deposits WHERE is_archived = 0
      GROUP BY farmer_id
    ) d ON f.id = d.farmer_id
    WHERE f.id = ?`,
    id
  );

  return row || null;
}

export async function getAllFarmers(
  filters?: FarmerFilters
): Promise<FarmerWithBalance[]> {
  const db = await getDatabase();

  let query = `
    SELECT
      f.*,
      COALESCE(w.total_work, 0) as total_work,
      COALESCE(d.total_deposits, 0) as total_deposits,
      COALESCE(w.total_work, 0) - COALESCE(d.total_deposits, 0) as outstanding_balance,
      COALESCE(w.work_count, 0) as work_count,
      COALESCE(d.deposit_count, 0) as deposit_count
    FROM farmers f
    LEFT JOIN (
      SELECT farmer_id, SUM(amount) as total_work, COUNT(*) as work_count
      FROM work_entries WHERE is_archived = 0
      GROUP BY farmer_id
    ) w ON f.id = w.farmer_id
    LEFT JOIN (
      SELECT farmer_id, SUM(amount) as total_deposits, COUNT(*) as deposit_count
      FROM deposits WHERE is_archived = 0
      GROUP BY farmer_id
    ) d ON f.id = d.farmer_id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (!filters?.includeArchived) {
    query += ' AND f.is_archived = 0';
  }

  if (filters?.search) {
    query += ' AND (f.name LIKE ? OR f.village LIKE ? OR f.phone LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters?.village) {
    query += ' AND f.village = ?';
    params.push(filters.village);
  }

  if (filters?.hasPendingBalance) {
    query +=
      ' AND (COALESCE(w.total_work, 0) - COALESCE(d.total_deposits, 0)) > 0';
  }

  // Sorting
  switch (filters?.sortBy) {
    case 'name':
      query += ' ORDER BY f.name COLLATE NOCASE ASC';
      break;
    case 'village':
      query += ' ORDER BY f.village COLLATE NOCASE ASC, f.name COLLATE NOCASE ASC';
      break;
    case 'balance':
      query += ' ORDER BY outstanding_balance DESC';
      break;
    case 'newest':
      query += ' ORDER BY f.created_at DESC';
      break;
    default:
      query += ' ORDER BY f.name COLLATE NOCASE ASC';
  }

  return db.getAllAsync<FarmerWithBalance>(query, ...params);
}

export async function checkDuplicateFarmer(
  name: string,
  phone?: string
): Promise<Farmer | null> {
  const db = await getDatabase();

  if (phone) {
    const row = await db.getFirstAsync<Farmer>(
      `SELECT * FROM farmers
       WHERE LOWER(name) = LOWER(?) AND phone = ? AND is_archived = 0`,
      name.trim(),
      phone.trim()
    );
    if (row) return row;
  }

  // Also check name-only match
  const row = await db.getFirstAsync<Farmer>(
    `SELECT * FROM farmers
     WHERE LOWER(name) = LOWER(?) AND is_archived = 0`,
    name.trim()
  );

  return row || null;
}

export async function getAllVillages(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ village: string }>(
    `SELECT DISTINCT village FROM farmers
     WHERE village IS NOT NULL AND village != '' AND is_archived = 0
     ORDER BY village COLLATE NOCASE ASC`
  );
  return rows.map((r) => r.village);
}

export async function getTotalFarmers(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM farmers WHERE is_archived = 0'
  );
  return row?.count || 0;
}
