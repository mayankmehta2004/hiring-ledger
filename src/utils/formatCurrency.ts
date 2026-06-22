// ============================================================
// Currency Formatting
// ============================================================

import { APP_CONFIG } from '../constants/config';

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return `${APP_CONFIG.currency}0`;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${APP_CONFIG.currency}${formatted}`;
}

export function formatCurrencyShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}${APP_CONFIG.currency}${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${APP_CONFIG.currency}${(abs / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${sign}${APP_CONFIG.currency}${(abs / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
}
