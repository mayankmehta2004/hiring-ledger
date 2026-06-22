// ============================================================
// Global Search
// ============================================================

import { getDatabase } from './connection';
import { SearchResult } from '../types';

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const db = await getDatabase();
  const searchTerm = `%${query.trim()}%`;

  // Search farmers
  const farmers = await db.getAllAsync<SearchResult>(
    `SELECT
      id,
      'farmer' as type,
      name as title,
      COALESCE(village, '') || CASE
        WHEN phone IS NOT NULL THEN ' • ' || phone
        ELSE ''
      END as subtitle,
      id as farmerId
    FROM farmers
    WHERE is_archived = 0
      AND (name LIKE ? OR village LIKE ? OR phone LIKE ?)
    ORDER BY name COLLATE NOCASE ASC
    LIMIT 10`,
    searchTerm,
    searchTerm,
    searchTerm
  );

  // Search work entries
  const workEntries = await db.getAllAsync<SearchResult>(
    `SELECT
      w.id,
      'work' as type,
      w.work_type || ' - ' || f.name as title,
      w.date || ' • ₹' || w.amount as subtitle,
      f.id as farmerId
    FROM work_entries w
    JOIN farmers f ON w.farmer_id = f.id
    WHERE w.is_archived = 0
      AND (w.work_type LIKE ? OR f.name LIKE ? OR CAST(w.amount AS TEXT) LIKE ? OR w.notes LIKE ?)
    ORDER BY w.date DESC
    LIMIT 10`,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm
  );

  // Search deposits
  const deposits = await db.getAllAsync<SearchResult>(
    `SELECT
      d.id,
      'deposit' as type,
      'Deposit - ' || f.name as title,
      d.date || ' • ₹' || d.amount as subtitle,
      f.id as farmerId
    FROM deposits d
    JOIN farmers f ON d.farmer_id = f.id
    WHERE d.is_archived = 0
      AND (f.name LIKE ? OR CAST(d.amount AS TEXT) LIKE ? OR d.notes LIKE ?)
    ORDER BY d.date DESC
    LIMIT 10`,
    searchTerm,
    searchTerm,
    searchTerm
  );

  return [...farmers, ...workEntries, ...deposits];
}
