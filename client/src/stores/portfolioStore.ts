import { create } from 'zustand';
import type { Investment, Project, User } from '@shared/schema';

interface PortfolioState {
  investments: Investment[];
  projects: Project[];
  user: User | null;
  totalValue: number;
  totalGains: number;
  averageROI: number;
  isLoading: boolean;
  
  // Actions
  setInvestments: (investments: Investment[]) => void;
  setProjects: (projects: Project[]) => void;
  setUser: (user: User) => void;
  updateInvestment: (investmentId: string, updates: Partial<Investment>) => void;
  calculatePortfolioMetrics: () => void;
  setLoading: (loading: boolean) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  investments: [],
  projects: [],
  user: null,
  totalValue: 0,
  totalGains: 0,
  averageROI: 0,
  isLoading: false,

  setInvestments: (investments) => {
    set({ investments });
    get().calculatePortfolioMetrics();
  },

  setProjects: (projects) => {
    set({ projects });
  },

  setUser: (user) => {
    set({ user });
  },

  updateInvestment: (investmentId, updates) => {
    const { investments } = get();
    const updatedInvestments = investments.map(inv =>
      inv.id === investmentId ? { ...inv, ...updates } : inv
    );
    set({ investments: updatedInvestments });
    get().calculatePortfolioMetrics();
  },

  calculatePortfolioMetrics: () => {
    const { investments } = get();
    
    if (investments.length === 0) {
      set({ totalValue: 0, totalGains: 0, averageROI: 0 });
      return;
    }

    const totalValue = investments.reduce((sum, inv) => 
      sum + parseFloat(inv.currentValue), 0
    );

    const totalInvested = investments.reduce((sum, inv) => 
      sum + parseFloat(inv.amount), 0
    );

    const totalGains = totalValue - totalInvested;
    const averageROI = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

    set({ totalValue, totalGains, averageROI });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
