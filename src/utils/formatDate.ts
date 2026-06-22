// ============================================================
// Date Formatting Utilities
// ============================================================

import { format, isToday, isYesterday, startOfMonth, endOfMonth } from 'date-fns';

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
}

export function formatDisplayDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM');
}

export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getToday(): string {
  return formatISODate(new Date());
}

export function getMonthRange(date?: Date): { start: string; end: string } {
  const d = date || new Date();
  return {
    start: formatISODate(startOfMonth(d)),
    end: formatISODate(endOfMonth(d)),
  };
}

export function formatMonthYear(monthStr: string): string {
  // monthStr is 'YYYY-MM'
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, 'MMM yyyy');
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
