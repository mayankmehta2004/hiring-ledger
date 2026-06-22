// ============================================================
// Deposit CRUD Operations
// ============================================================

import { getDatabase } from './connection';
import { logAction } from './auditLog';
import { Deposit, DepositInput } from '../types';

export async function createDeposit(input: DepositInput): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO deposits (farmer_id, date, amount, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.farmer_id,
    input.date,
    input.amount,
    input.notes?.trim() || null,
    now,
    now
  );

  const depositId = result.lastInsertRowId;

  await logAction('deposit', depositId, 'create', null, {
    ...input,
    id: depositId,
  });

  return depositId;
}

export async function updateDeposit(
  id: number,
  input: Partial<DepositInput>
): Promise<void> {
  const db = await getDatabase();

  const oldDeposit = await db.getFirstAsync<Deposit>(
    'SELECT * FROM deposits WHERE id = ?',
    id
  );

  if (!oldDeposit) throw new Error(`Deposit not found: ${id}`);

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
  if (input.amount !== undefined) {
    updates.push('amount = ?');
    values.push(input.amount);
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
    `UPDATE deposits SET ${updates.join(', ')} WHERE id = ?`,
    ...values
  );

  await logAction('deposit', id, 'update', oldDeposit as unknown as Record<string, unknown>, {
    ...input,
  });
}

export async function archiveDeposit(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const oldDeposit = await db.getFirstAsync<Deposit>(
    'SELECT * FROM deposits WHERE id = ?',
    id
  );

  await db.runAsync(
    'UPDATE deposits SET is_archived = 1, updated_at = ? WHERE id = ?',
    now,
    id
  );

  await logAction('deposit', id, 'archive', oldDeposit as unknown as Record<string, unknown>, {
    is_archived: 1,
  });
}

export async function restoreDeposit(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE deposits SET is_archived = 0, updated_at = ? WHERE id = ?',
    now,
    id
  );

  await logAction('deposit', id, 'restore', { is_archived: 1 }, { is_archived: 0 });
}

export async function deleteDeposit(id: number): Promise<void> {
  const db = await getDatabase();

  // Delete associated audit logs
  await db.runAsync(
    "DELETE FROM audit_logs WHERE entity_type = 'deposit' AND entity_id = ?",
    id
  );

  // Permanently delete the deposit
  await db.runAsync('DELETE FROM deposits WHERE id = ?', id);
}

export async function deleteAllDepositsForFarmer(farmerId: number): Promise<void> {
  const db = await getDatabase();

  // Delete audit logs for all deposits of this farmer
  await db.runAsync(
    `DELETE FROM audit_logs WHERE entity_type = 'deposit' AND entity_id IN
     (SELECT id FROM deposits WHERE farmer_id = ?)`,
    farmerId
  );

  // Delete all deposits
  await db.runAsync('DELETE FROM deposits WHERE farmer_id = ?', farmerId);
}

export async function getDepositsForFarmer(
  farmerId: number,
  includeArchived: boolean = false
): Promise<Deposit[]> {
  const db = await getDatabase();
  const archivedClause = includeArchived ? '' : ' AND is_archived = 0';

  return db.getAllAsync<Deposit>(
    `SELECT * FROM deposits
     WHERE farmer_id = ?${archivedClause}
     ORDER BY date DESC, created_at DESC`,
    farmerId
  );
}
