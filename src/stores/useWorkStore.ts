// ============================================================
// Work Entry Store
// ============================================================

import { create } from 'zustand';
import { WorkEntryInput, RecentActivity, DashboardSummary } from '../types';
import {
  createWorkEntry,
  archiveWorkEntry as dbArchiveWork,
  restoreWorkEntry as dbRestoreWork,
  deleteWorkEntry as dbDeleteWork,
  getTodayWorkTotal,
  getMonthWorkTotal,
  getRecentActivity,
  getTotalOutstandingBalance,
} from '../database/workEntries';
import { getTotalFarmers } from '../database/farmers';

interface WorkState {
  recentActivity: RecentActivity[];
  dashboardSummary: DashboardSummary;
  isLoading: boolean;

  loadDashboardData: () => Promise<void>;
  addWorkEntry: (input: WorkEntryInput) => Promise<number>;
  archiveWorkEntry: (id: number) => Promise<void>;
  restoreWorkEntry: (id: number) => Promise<void>;
  deleteWorkEntry: (id: number) => Promise<void>;
}

const defaultSummary: DashboardSummary = {
  totalFarmers: 0,
  outstandingBalance: 0,
  todayWork: 0,
  monthWork: 0,
};

export const useWorkStore = create<WorkState>((set, get) => ({
  recentActivity: [],
  dashboardSummary: defaultSummary,
  isLoading: false,

  loadDashboardData: async () => {
    set({ isLoading: true });
    try {
      const [totalFarmers, outstandingBalance, todayWork, monthWork, recentActivity] =
        await Promise.all([
          getTotalFarmers(),
          getTotalOutstandingBalance(),
          getTodayWorkTotal(),
          getMonthWorkTotal(),
          getRecentActivity(20),
        ]);

      set({
        dashboardSummary: { totalFarmers, outstandingBalance, todayWork, monthWork },
        recentActivity,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      set({ isLoading: false });
    }
  },

  addWorkEntry: async (input: WorkEntryInput) => {
    const id = await createWorkEntry(input);
    await get().loadDashboardData();
    return id;
  },

  archiveWorkEntry: async (id: number) => {
    await dbArchiveWork(id);
    await get().loadDashboardData();
  },

  restoreWorkEntry: async (id: number) => {
    await dbRestoreWork(id);
    await get().loadDashboardData();
  },

  deleteWorkEntry: async (id: number) => {
    await dbDeleteWork(id);
    await get().loadDashboardData();
  },
}));

