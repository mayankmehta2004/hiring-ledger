// ============================================================
// Farmer Store
// ============================================================

import { create } from 'zustand';
import {
  FarmerWithBalance,
  FarmerInput,
  FarmerFilters,
} from '../types';
import {
  getAllFarmers,
  createFarmer,
  updateFarmer,
  archiveFarmer as dbArchiveFarmer,
  restoreFarmer as dbRestoreFarmer,
  deleteFarmerPermanently as dbDeleteFarmer,
  getFarmer,
  getAllVillages,
} from '../database/farmers';

interface FarmerState {
  farmers: FarmerWithBalance[];
  villages: string[];
  isLoading: boolean;
  currentFarmer: FarmerWithBalance | null;
  filters: FarmerFilters;

  loadFarmers: (filters?: FarmerFilters) => Promise<void>;
  loadVillages: () => Promise<void>;
  loadFarmerProfile: (id: number) => Promise<void>;
  addFarmer: (input: FarmerInput) => Promise<number>;
  editFarmer: (id: number, input: Partial<FarmerInput>) => Promise<void>;
  archiveFarmer: (id: number) => Promise<void>;
  restoreFarmer: (id: number) => Promise<void>;
  deleteFarmerPermanently: (id: number) => Promise<void>;
  setFilters: (filters: FarmerFilters) => void;
  refreshCurrentFarmer: () => Promise<void>;
}

export const useFarmerStore = create<FarmerState>((set, get) => ({
  farmers: [],
  villages: [],
  isLoading: false,
  currentFarmer: null,
  filters: { sortBy: 'name' },

  loadFarmers: async (filters?: FarmerFilters) => {
    set({ isLoading: true });
    try {
      const f = filters || get().filters;
      const farmers = await getAllFarmers(f);
      set({ farmers, filters: f, isLoading: false });
    } catch (err) {
      console.error('Failed to load farmers:', err);
      set({ isLoading: false });
    }
  },

  loadVillages: async () => {
    const villages = await getAllVillages();
    set({ villages });
  },

  loadFarmerProfile: async (id: number) => {
    const farmer = await getFarmer(id);
    set({ currentFarmer: farmer });
  },

  addFarmer: async (input: FarmerInput) => {
    const id = await createFarmer(input);
    await get().loadFarmers();
    await get().loadVillages();
    return id;
  },

  editFarmer: async (id: number, input: Partial<FarmerInput>) => {
    await updateFarmer(id, input);
    await get().loadFarmers();
    if (get().currentFarmer?.id === id) {
      await get().loadFarmerProfile(id);
    }
  },

  archiveFarmer: async (id: number) => {
    await dbArchiveFarmer(id);
    await get().loadFarmers();
    set({ currentFarmer: null });
  },

  restoreFarmer: async (id: number) => {
    await dbRestoreFarmer(id);
    await get().loadFarmers();
  },

  deleteFarmerPermanently: async (id: number) => {
    await dbDeleteFarmer(id);
    await get().loadFarmers();
    set({ currentFarmer: null });
  },

  setFilters: (filters: FarmerFilters) => {
    set({ filters });
    get().loadFarmers(filters);
  },

  refreshCurrentFarmer: async () => {
    const current = get().currentFarmer;
    if (current) {
      await get().loadFarmerProfile(current.id);
    }
  },
}));

