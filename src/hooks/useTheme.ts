// ============================================================
// useTheme Hook
// ============================================================

import { useAppStore } from '../stores/useAppStore';
import { Colors, ThemeColors } from '../constants/theme';

export function useTheme(): ThemeColors & { isDark: boolean } {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const colors = isDarkMode ? Colors.dark : Colors.light;
  return { ...colors, isDark: isDarkMode };
}
