// ============================================================
// App Store — Theme, DB readiness, global state
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  isDarkMode: boolean;
  isDbReady: boolean;
  lastBackupDate: string | null;

  toggleDarkMode: () => void;
  setDbReady: (ready: boolean) => void;
  setLastBackupDate: (date: string | null) => void;
  loadSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isDarkMode: false,
  isDbReady: false,
  lastBackupDate: null,

  toggleDarkMode: async () => {
    set((state) => {
      const newValue = !state.isDarkMode;
      AsyncStorage.setItem('dark_mode', String(newValue));
      return { isDarkMode: newValue };
    });
  },

  setDbReady: (ready: boolean) => set({ isDbReady: ready }),

  setLastBackupDate: (date: string | null) => set({ lastBackupDate: date }),

  loadSettings: async () => {
    try {
      const darkMode = await AsyncStorage.getItem('dark_mode');
      const lastBackup = await AsyncStorage.getItem('last_backup_date');

      set({
        isDarkMode: darkMode === 'true',
        lastBackupDate: lastBackup,
      });
    } catch {
      // Silently fail — defaults are fine
    }
  },
}));
