// ============================================================
// Hiring Centre Ledger — TypeScript Type Definitions
// ============================================================

// ---- Database Row Types ----

export interface Farmer {
  id: number;
  uuid: string;
  name: string;
  phone: string | null;
  village: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_archived: number; // 0 or 1 (SQLite boolean)
}

export interface WorkEntry {
  id: number;
  farmer_id: number;
  date: string; // ISO date: YYYY-MM-DD
  work_type: string;
  quantity: number | null;
  unit: string | null;
  rate: number | null;
  amount: number;
  description1: string | null;
  description2: string | null;
  khait_ka_naam: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_archived: number;
}

export interface Deposit {
  id: number;
  farmer_id: number;
  date: string; // ISO date: YYYY-MM-DD
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_archived: number;
}

export interface AuditLog {
  id: number;
  entity_type: 'farmer' | 'work_entry' | 'deposit';
  entity_id: number;
  action: 'create' | 'update' | 'archive' | 'restore';
  old_value_json: string | null;
  new_value_json: string | null;
  timestamp: string;
}

// ---- Computed / View Types ----

export interface FarmerWithBalance extends Farmer {
  total_work: number;
  total_deposits: number;
  outstanding_balance: number;
  work_count: number;
  deposit_count: number;
}

export interface TimelineEntry {
  id: number;
  type: 'work' | 'deposit';
  date: string;
  amount: number;
  description: string; // e.g. "Rotavator - 2 Acre" or "Deposit"
  notes: string | null;
  running_balance?: number;
}

export interface RecentActivity {
  id: number;
  type: 'work' | 'deposit';
  date: string;
  amount: number;
  description: string;
  farmer_name: string;
  farmer_id: number;
}

// ---- Form Input Types ----

export interface FarmerInput {
  name: string;
  phone?: string;
  village?: string;
  address?: string;
  notes?: string;
}

export interface WorkEntryInput {
  farmer_id: number;
  date: string;
  work_type?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount: number;
  description1?: string;
  description2?: string;
  khait_ka_naam?: string;
  notes?: string;
}

export interface DepositInput {
  farmer_id: number;
  date: string;
  amount: number;
  notes?: string;
}

// ---- Filter & Sort Types ----

export type FarmerSortBy = 'name' | 'village' | 'balance' | 'newest';

export interface FarmerFilters {
  search?: string;
  village?: string;
  hasPendingBalance?: boolean;
  sortBy?: FarmerSortBy;
  includeArchived?: boolean;
}

// ---- Report Types ----

export type ReportType =
  | 'farmer_ledger'
  | 'all_farmers'
  | 'village_report'
  | 'outstanding'
  | 'monthly_summary'
  | 'work_type_report'
  | 'date_range';

export interface ReportParams {
  type: ReportType;
  farmerId?: number;
  village?: string;
  startDate?: string;
  endDate?: string;
  workType?: string;
  year?: number;
}

export interface FarmerLedgerRow {
  date: string;
  type: 'Work' | 'Deposit';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  work_type?: string | null;
  quantity?: number | null;
  unit?: string | null;
  rate?: number | null;
  description1?: string | null;
  description2?: string | null;
  khait_ka_naam?: string | null;
  notes?: string | null;
}

export interface AllFarmersReportRow {
  farmer_name: string;
  village: string;
  date: string;
  type: string;
  amount: number;
  description1?: string | null;
  description2?: string | null;
  khait_ka_naam?: string | null;
  notes?: string | null;
}

export interface OutstandingReportRow {
  farmer_name: string;
  village: string;
  work_total: number;
  deposits_total: number;
  pending: number;
}

export interface MonthlySummaryRow {
  month: string;
  work_amount: number;
  deposits: number;
  outstanding: number;
}

export interface WorkTypeReportRow {
  work_type: string;
  count: number;
  total_amount: number;
  avg_rate: number;
}

// ---- Search Types ----

export interface SearchResult {
  id: number;
  type: 'farmer' | 'work' | 'deposit';
  title: string;
  subtitle: string;
  farmerId: number;
}

// ---- Database Stats ----

export interface DatabaseStats {
  farmerCount: number;
  workEntryCount: number;
  depositCount: number;
  auditLogCount: number;
  dbSizeBytes: number;
  lastBackupDate: string | null;
}

// ---- Dashboard Summary ----

export interface DashboardSummary {
  totalFarmers: number;
  outstandingBalance: number;
  todayWork: number;
  monthWork: number;
}
