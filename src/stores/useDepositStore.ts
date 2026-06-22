// ============================================================
// Deposit Store
// ============================================================

import { create } from 'zustand';
import { DepositInput } from '../types';
import {
  createDeposit,
  archiveDeposit as dbArchiveDeposit,
  restoreDeposit as dbRestoreDeposit,
  deleteDeposit as dbDeleteDeposit,
} from '../database/deposits';

interface DepositState {
  addDeposit: (input: DepositInput) => Promise<number>;
  archiveDeposit: (id: number) => Promise<void>;
  restoreDeposit: (id: number) => Promise<void>;
  deleteDeposit: (id: number) => Promise<void>;
}

export const useDepositStore = create<DepositState>(() => ({
  addDeposit: async (input: DepositInput) => {
    return createDeposit(input);
  },

  archiveDeposit: async (id: number) => {
    await dbArchiveDeposit(id);
  },

  restoreDeposit: async (id: number) => {
    await dbRestoreDeposit(id);
  },

  deleteDeposit: async (id: number) => {
    await dbDeleteDeposit(id);
  },
}));
