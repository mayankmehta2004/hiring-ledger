// ============================================================
// Units & App Configuration
// ============================================================

export const UNITS = [
  { label: 'Bigha', value: 'Bigha' },
  { label: 'Hours', value: 'Hours' },
] as const;

export type UnitValue = (typeof UNITS)[number]['value'];

export const APP_CONFIG = {
  appName: 'Hiring Centre Ledger',
  version: '1.0.0',
  dbName: 'hiring_centre_ledger.db',
  backupPrefix: 'hcl_backup',
  jsonBackupPrefix: 'hcl_json_backup',
  maxRecentActivity: 20,
  searchDebounceMs: 300,
  backupReminderDays: 7,
  currency: '₹',
  dateFormat: 'dd MMM yyyy',
  dateFormatShort: 'dd MMM',
  isoDateFormat: 'yyyy-MM-dd',
};
