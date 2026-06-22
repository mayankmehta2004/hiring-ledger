// ============================================================
// Report Query Functions
// ============================================================

import { getDatabase } from './connection';
import {
  TimelineEntry,
  FarmerLedgerRow,
  AllFarmersReportRow,
  OutstandingReportRow,
  MonthlySummaryRow,
  WorkTypeReportRow,
} from '../types';

export async function getFarmerTimeline(
  farmerId: number
): Promise<TimelineEntry[]> {
  const db = await getDatabase();

  const entries = await db.getAllAsync<{
    id: number;
    type: 'work' | 'deposit';
    date: string;
    amount: number;
    description1: string | null;
    description2: string | null;
    khait_ka_naam: string | null;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
  }>(
    `SELECT
      id, 'work' as type, date, amount,
      description1, description2, khait_ka_naam, quantity, unit,
      notes
    FROM work_entries
    WHERE farmer_id = ? AND is_archived = 0

    UNION ALL

    SELECT
      id, 'deposit' as type, date, amount,
      NULL as description1, NULL as description2, NULL as khait_ka_naam, NULL as quantity, NULL as unit,
      notes
    FROM deposits
    WHERE farmer_id = ? AND is_archived = 0

    ORDER BY date ASC, type DESC`,
    farmerId,
    farmerId
  );

  // Calculate running balance
  let runningBalance = 0;
  return entries.map((entry) => {
    if (entry.type === 'work') {
      runningBalance += entry.amount;
    } else {
      runningBalance -= entry.amount;
    }

    let description = '';
    if (entry.type === 'work') {
      if (entry.description1) {
        description = `${entry.description1}${entry.khait_ka_naam ? ` - ${entry.khait_ka_naam}` : ''}`;
      } else if (entry.description2) {
        description = `${entry.description2}${entry.khait_ka_naam ? ` - ${entry.khait_ka_naam}` : ''}`;
      } else {
        description = 'Work';
      }
      if (entry.quantity) {
        description += ` (${entry.quantity} ${entry.unit || ''})`;
      }
    } else {
      description = 'Deposit';
    }

    return {
      id: entry.id,
      type: entry.type,
      date: entry.date,
      amount: entry.amount,
      description,
      notes: entry.notes,
      running_balance: runningBalance,
    };
  });
}

export async function getFarmerLedgerReport(
  farmerId: number,
  startDate?: string,
  endDate?: string
): Promise<FarmerLedgerRow[]> {
  const db = await getDatabase();

  let dateClause = '';
  const params: (number | string)[] = [farmerId, farmerId];

  if (startDate) {
    dateClause += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    dateClause += ' AND date <= ?';
    params.push(endDate);
  }

  // We need to apply date filter to both halves of the UNION
  // so we build the query with duplicated date params
  const dateParamsForWork: (number | string)[] = [farmerId];
  const dateParamsForDeposit: (number | string)[] = [farmerId];
  let workDateClause = '';
  let depositDateClause = '';

  if (startDate) {
    workDateClause += ' AND date >= ?';
    depositDateClause += ' AND date >= ?';
    dateParamsForWork.push(startDate);
    dateParamsForDeposit.push(startDate);
  }
  if (endDate) {
    workDateClause += ' AND date <= ?';
    depositDateClause += ' AND date <= ?';
    dateParamsForWork.push(endDate);
    dateParamsForDeposit.push(endDate);
  }

  const allParams = [...dateParamsForWork, ...dateParamsForDeposit];

  const entries = await db.getAllAsync<{
    id: number;
    date: string;
    type: 'work' | 'deposit';
    work_type: string | null;
    quantity: number | null;
    unit: string | null;
    rate: number | null;
    amount: number;
    description1: string | null;
    description2: string | null;
    khait_ka_naam: string | null;
    notes: string | null;
  }>(
    `SELECT id, date, 'work' as type,
      work_type, quantity, unit, rate, amount,
      description1, description2, khait_ka_naam, notes
    FROM work_entries
    WHERE farmer_id = ? AND is_archived = 0${workDateClause}

    UNION ALL

    SELECT id, date, 'deposit' as type,
      NULL as work_type, NULL as quantity, NULL as unit, NULL as rate, amount,
      NULL as description1, NULL as description2, NULL as khait_ka_naam, notes
    FROM deposits
    WHERE farmer_id = ? AND is_archived = 0${depositDateClause}

    ORDER BY date ASC, id ASC`,
    ...allParams
  );

  let balance = 0;
  return entries.map((entry) => {
    const isWork = entry.type === 'work';
    if (isWork) {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
    return {
      date: entry.date,
      type: isWork ? 'Work' : 'Deposit',
      description: isWork
        ? `${entry.work_type}${entry.quantity ? ` - ${entry.quantity} ${entry.unit || ''}` : ''}`
        : entry.notes || 'Payment',
      debit: isWork ? entry.amount : 0,
      credit: isWork ? 0 : entry.amount,
      balance,
      work_type: entry.work_type,
      quantity: entry.quantity,
      unit: entry.unit,
      rate: entry.rate,
      description1: entry.description1,
      description2: entry.description2,
      khait_ka_naam: entry.khait_ka_naam,
      notes: entry.notes,
    };
  });
}

export async function getAllFarmersReport(
  startDate?: string,
  endDate?: string
): Promise<AllFarmersReportRow[]> {
  const db = await getDatabase();
  const params: string[] = [];
  let dateClauseW = '';
  let dateClauseD = '';

  if (startDate) {
    dateClauseW += ' AND w.date >= ?';
    dateClauseD += ' AND d.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    dateClauseW += ' AND w.date <= ?';
    dateClauseD += ' AND d.date <= ?';
    params.push(endDate);
  }

  const workParams = [...params];
  const depositParams = [...params];

  return db.getAllAsync<AllFarmersReportRow>(
    `SELECT f.name as farmer_name, COALESCE(f.village, '') as village,
      w.date, w.work_type as type, w.amount, w.description1, w.description2, w.khait_ka_naam, w.notes
    FROM work_entries w
    JOIN farmers f ON w.farmer_id = f.id
    WHERE w.is_archived = 0 AND f.is_archived = 0${dateClauseW}

    UNION ALL

    SELECT f.name as farmer_name, COALESCE(f.village, '') as village,
      d.date, 'Deposit' as type, d.amount, NULL as description1, NULL as description2, NULL as khait_ka_naam, d.notes
    FROM deposits d
    JOIN farmers f ON d.farmer_id = f.id
    WHERE d.is_archived = 0 AND f.is_archived = 0${dateClauseD}

    ORDER BY date DESC`,
    ...workParams,
    ...depositParams
  );
}

export async function getOutstandingReport(): Promise<OutstandingReportRow[]> {
  const db = await getDatabase();

  return db.getAllAsync<OutstandingReportRow>(
    `SELECT
      f.name as farmer_name,
      COALESCE(f.village, '') as village,
      COALESCE(w.total, 0) as work_total,
      COALESCE(d.total, 0) as deposits_total,
      COALESCE(w.total, 0) - COALESCE(d.total, 0) as pending
    FROM farmers f
    LEFT JOIN (
      SELECT farmer_id, SUM(amount) as total
      FROM work_entries WHERE is_archived = 0
      GROUP BY farmer_id
    ) w ON f.id = w.farmer_id
    LEFT JOIN (
      SELECT farmer_id, SUM(amount) as total
      FROM deposits WHERE is_archived = 0
      GROUP BY farmer_id
    ) d ON f.id = d.farmer_id
    WHERE f.is_archived = 0
      AND (COALESCE(w.total, 0) - COALESCE(d.total, 0)) > 0
    ORDER BY pending DESC`
  );
}

export async function getMonthlySummary(
  year?: number
): Promise<MonthlySummaryRow[]> {
  const db = await getDatabase();
  const y = year ?? new Date().getFullYear();

  return db.getAllAsync<MonthlySummaryRow>(
    `SELECT
      month,
      work_amount,
      deposits,
      work_amount - deposits as outstanding
    FROM (
      SELECT
        strftime('%Y-%m', dates.date) as month,
        COALESCE(w.amount, 0) as work_amount,
        COALESCE(d.amount, 0) as deposits
      FROM (
        SELECT DISTINCT strftime('%Y-%m', date) as date
        FROM work_entries WHERE is_archived = 0 AND strftime('%Y', date) = ?
        UNION
        SELECT DISTINCT strftime('%Y-%m', date) as date
        FROM deposits WHERE is_archived = 0 AND strftime('%Y', date) = ?
      ) dates
      LEFT JOIN (
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as amount
        FROM work_entries WHERE is_archived = 0 AND strftime('%Y', date) = ?
        GROUP BY month
      ) w ON dates.date = w.month
      LEFT JOIN (
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as amount
        FROM deposits WHERE is_archived = 0 AND strftime('%Y', date) = ?
        GROUP BY month
      ) d ON dates.date = d.month
    )
    ORDER BY month ASC`,
    String(y),
    String(y),
    String(y),
    String(y)
  );
}

export async function getWorkTypeReport(
  startDate?: string,
  endDate?: string
): Promise<WorkTypeReportRow[]> {
  const db = await getDatabase();
  const params: string[] = [];
  let dateClause = '';

  if (startDate) {
    dateClause += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    dateClause += ' AND date <= ?';
    params.push(endDate);
  }

  return db.getAllAsync<WorkTypeReportRow>(
    `SELECT
      work_type,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      ROUND(AVG(rate), 2) as avg_rate
    FROM work_entries
    WHERE is_archived = 0${dateClause}
    GROUP BY work_type
    ORDER BY total_amount DESC`,
    ...params
  );
}
