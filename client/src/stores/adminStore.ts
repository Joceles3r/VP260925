import { create } from 'zustand';
import type { User, Project, Transaction } from '@shared/schema';

interface AdminStats {
  users: {
    totalUsers: number;
    activeUsers: number;
    kycPending: number;
  };
  projects: {
    totalProjects: number;
    pendingProjects: number;
    activeProjects: number;
  };
  transactions: {
    totalVolume: string;
    todayVolume: string;
    totalCommissions: string;
  };
}

interface AdminState {
  stats: AdminStats | null;
  users: User[];
  pendingProjects: Project[];
  transactions: Transaction[];
  activeTab: string;
  isLoading: boolean;
  
  // Actions
  setStats: (stats: AdminStats) => void;
  setUsers: (users: User[]) => void;
  setPendingProjects: (projects: Project[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  updateProjectStatus: (projectId: string, status: string) => void;
  updateUserKyc: (userId: string, verified: boolean) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  users: [],
  pendingProjects: [],
  transactions: [],
  activeTab: 'users',
  isLoading: false,

  setStats: (stats) => {
    set({ stats });
  },

  setUsers: (users) => {
    set({ users });
  },

  setPendingProjects: (pendingProjects) => {
    set({ pendingProjects });
  },

  setTransactions: (transactions) => {
    set({ transactions });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  updateProjectStatus: (projectId, status) => {
    const { pendingProjects } = get();
    const updatedProjects = pendingProjects.map(project =>
      project.id === projectId ? { ...project, status } : project
    );
    set({ pendingProjects: updatedProjects });
  },

  updateUserKyc: (userId, verified) => {
    const { users } = get();
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, kycVerified: verified } : user
    );
    set({ users: updatedUsers });
  },
}));
