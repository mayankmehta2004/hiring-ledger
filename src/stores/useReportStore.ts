// ============================================================
// Report Store
// ============================================================

import { create } from 'zustand';
import { ReportType, ReportParams } from '../types';
import {
  getFarmerLedgerReport,
  getAllFarmersReport,
  getOutstandingReport,
  getMonthlySummary,
  getWorkTypeReport,
} from '../database/reports';
import {
  exportFarmerLedger,
  exportAllFarmersReport,
  exportOutstandingReport,
  exportMonthlySummary,
} from '../utils/excelExport';

interface ReportState {
  reportData: any[];
  isLoading: boolean;
  currentReportType: ReportType | null;

  generateReport: (params: ReportParams) => Promise<void>;
  exportReport: (params: ReportParams) => Promise<void>;
  clearReport: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reportData: [],
  isLoading: false,
  currentReportType: null,

  generateReport: async (params: ReportParams) => {
    set({ isLoading: true });
    try {
      let data: any[] = [];

      switch (params.type) {
        case 'farmer_ledger':
          if (params.farmerId) {
            data = await getFarmerLedgerReport(
              params.farmerId,
              params.startDate,
              params.endDate
            );
          }
          break;
        case 'all_farmers':
          data = await getAllFarmersReport(params.startDate, params.endDate);
          break;
        case 'outstanding':
          data = await getOutstandingReport();
          break;
        case 'monthly_summary':
          data = await getMonthlySummary(params.year);
          break;
        case 'work_type_report':
          data = await getWorkTypeReport(params.startDate, params.endDate);
          break;
        default:
          data = await getAllFarmersReport(params.startDate, params.endDate);
      }

      set({ reportData: data, currentReportType: params.type, isLoading: false });
    } catch (err) {
      console.error('Failed to generate report:', err);
      set({ isLoading: false });
    }
  },

  exportReport: async (params: ReportParams) => {
    try {
      switch (params.type) {
        case 'farmer_ledger':
          if (params.farmerId) {
            await exportFarmerLedger(
              params.farmerId,
              params.startDate,
              params.endDate
            );
          }
          break;
        case 'all_farmers':
          await exportAllFarmersReport(params.startDate, params.endDate);
          break;
        case 'outstanding':
          await exportOutstandingReport();
          break;
        case 'monthly_summary':
          await exportMonthlySummary(params.year);
          break;
      }
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  },

  clearReport: () => set({ reportData: [], currentReportType: null }),
}));
