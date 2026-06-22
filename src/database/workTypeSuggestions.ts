// ============================================================
// Work Type Suggestions — Auto-suggest from past entries
// ============================================================

import { getDatabase } from './connection';

export interface WorkTypeSuggestion {
  id: number;
  value: string;
  usage_count: number;
  last_used_at: string;
}

export async function getWorkTypeSuggestions(
  query?: string
): Promise<WorkTypeSuggestion[]> {
  const db = await getDatabase();

  if (query && query.trim().length > 0) {
    return db.getAllAsync<WorkTypeSuggestion>(
      `SELECT * FROM work_type_suggestions
       WHERE value LIKE ?
       ORDER BY usage_count DESC, last_used_at DESC
       LIMIT 20`,
      `%${query.trim()}%`
    );
  }

  return db.getAllAsync<WorkTypeSuggestion>(
    `SELECT * FROM work_type_suggestions
     ORDER BY usage_count DESC, last_used_at DESC
     LIMIT 20`
  );
}

export async function addOrUpdateWorkTypeSuggestion(
  value: string
): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) return;

  const db = await getDatabase();
  const now = new Date().toISOString();

  // Try to update existing
  const result = await db.runAsync(
    `UPDATE work_type_suggestions
     SET usage_count = usage_count + 1, last_used_at = ?
     WHERE LOWER(value) = LOWER(?)`,
    now,
    trimmed
  );

  // If no row was updated, insert new
  if (result.changes === 0) {
    await db.runAsync(
      `INSERT INTO work_type_suggestions (value, usage_count, last_used_at)
       VALUES (?, 1, ?)`,
      trimmed,
      now
    );
  }
}
