import type { ApiResponse, PaginatedResponse, AuthUser, ProjectWithCreator, InvestmentWithProject, NotificationWithProject } from '@shared/types';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    return this.request<ApiResponse<AuthUser>>('/auth/me');
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/logout', { method: 'POST' });
  }

  // Projects endpoints
  async getProjects(params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ProjectWithCreator>> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<PaginatedResponse<ProjectWithCreator>>(
      `/projects${query ? `?${query}` : ''}`
    );
  }

  // Investments endpoints
  async getInvestments(): Promise<PaginatedResponse<InvestmentWithProject>> {
    return this.request<PaginatedResponse<InvestmentWithProject>>('/investments');
  }

  // Notifications endpoints
  async getNotifications(): Promise<PaginatedResponse<NotificationWithProject>> {
    return this.request<PaginatedResponse<NotificationWithProject>>('/notifications');
  }

  // Books endpoints
  async getBooks(params?: {
    price?: number;
    sortBy?: string;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.price) searchParams.set('price', params.price.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<any>>(
      `/books${query ? `?${query}` : ''}`
    );
  }

  // Ads endpoints
  async getAds(params?: {
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<any>>(
      `/ads${query ? `?${query}` : ''}`
    );
  }

  // Curiosity stats
  async getCuriosityStats(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/curiosity-stats');
  }

  // Visual constants
  async getVisualConstants(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/visual-constants');
  }

  // Disclaimer
  async getDisclaimer(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/disclaimer');
  }
}

export const apiClient = new ApiClient();

// Convenience exports
export const authApi = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  logout: () => apiClient.logout(),
};

export const projectsApi = {
  getProjects: (params?: Parameters<typeof apiClient.getProjects>[0]) => 
    apiClient.getProjects(params),
};

export const investmentsApi = {
  getInvestments: () => apiClient.getInvestments(),
};

export const notificationsApi = {
  getNotifications: () => apiClient.getNotifications(),
};