// ============================================================
// Theme — Colors, Typography, Spacing
// ============================================================

export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F7F8FA',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    success: '#059669',
    successLight: '#D1FAE5',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    card: '#FFFFFF',
    cardPressed: '#F9FAFB',
    shadow: 'rgba(0, 0, 0, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    fab: '#2563EB',
    fabText: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarInactive: '#9CA3AF',
    statusBar: 'dark-content' as 'dark-content' | 'light-content',
    headerBg: '#FFFFFF',
    inputBg: '#F9FAFB',
    inputBorder: '#D1D5DB',
    placeholder: '#9CA3AF',
    chipBg: '#F3F4F6',
    chipText: '#374151',
    chipActiveBg: '#2563EB',
    chipActiveText: '#FFFFFF',
    depositBg: '#ECFDF5',
    workBg: '#EFF6FF',
    archiveBg: '#FEF2F2',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    success: '#10B981',
    successLight: '#064E3B',
    danger: '#EF4444',
    dangerLight: '#7F1D1D',
    warning: '#F59E0B',
    warningLight: '#78350F',
    border: '#334155',
    borderLight: '#1E293B',
    card: '#1E293B',
    cardPressed: '#334155',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    fab: '#3B82F6',
    fabText: '#FFFFFF',
    tabBar: '#1E293B',
    tabBarInactive: '#64748B',
    statusBar: 'light-content' as 'dark-content' | 'light-content',
    headerBg: '#0F172A',
    inputBg: '#1E293B',
    inputBorder: '#475569',
    placeholder: '#64748B',
    chipBg: '#334155',
    chipText: '#CBD5E1',
    chipActiveBg: '#3B82F6',
    chipActiveText: '#FFFFFF',
    depositBg: '#064E3B',
    workBg: '#1E3A5F',
    archiveBg: '#7F1D1D',
  },
};

export type ThemeColors = typeof Colors.light;

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  amountLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const HitSlop = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
};

export const MIN_TOUCH_TARGET = 48;
