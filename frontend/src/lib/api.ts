import type { 
  ApiResponse, 
  PaginatedResponse, 
  AuthUser,
  Project,
  Investment,
  InvestmentRequest,
  AdminStats,
  CreateSocialPostRequest,
  SocialPost,
  ContentReport,
  ModerationAction,
  ProjectWithCreator,
  InvestmentWithProject,
  NotificationWithProject
} from '@shared/types';

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorDetails = undefined;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new ApiError(errorMessage, response.status, errorDetails);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      'Network error. Please check your connection and try again.',
      0
    );
  }
}

// =============================================================================
// AUTHENTICATION API
// =============================================================================

export const authApi = {
  getCurrentUser: () => fetchApi<AuthUser>('/auth/me'),
  
  logout: () => fetchApi<void>('/auth/logout', { method: 'POST' }),
};

// =============================================================================
// PROJECTS API
// =============================================================================

export const projectsApi = {
  getProjects: (params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/projects${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return fetchApi<ProjectWithCreator[]>(endpoint) as Promise<PaginatedResponse<ProjectWithCreator>>;
  },
  
  getProject: (id: string) => fetchApi<ProjectWithCreator>(`/projects/${id}`),
  
  createProject: (data: {
    title: string;
    description: string;
    category: string;
    targetAmount: number;
    videoUrl?: string;
    thumbnailUrl?: string;
  }) => fetchApi<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateProject: (id: string, data: Partial<Project>) => fetchApi<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteProject: (id: string) => fetchApi<void>(`/projects/${id}`, {
    method: 'DELETE',
  }),
};

// =============================================================================
// INVESTMENTS API
// =============================================================================

export const investmentsApi = {
  createInvestment: (data: InvestmentRequest) => fetchApi<Investment>('/investments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMyInvestments: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/investments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return fetchApi<InvestmentWithProject[]>(endpoint) as Promise<PaginatedResponse<InvestmentWithProject>>;
  },
  
  getInvestment: (id: string) => fetchApi<InvestmentWithProject>(`/investments/${id}`),
};

// =============================================================================
// SOCIAL API
// =============================================================================

export const socialApi = {
  getPosts: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/social/posts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return fetchApi<SocialPost[]>(endpoint) as Promise<PaginatedResponse<SocialPost>>;
  },
  
  createPost: (data: CreateSocialPostRequest) => fetchApi<SocialPost>('/social/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  likePost: (postId: string) => fetchApi<void>(`/social/posts/${postId}/like`, {
    method: 'POST',
  }),
  
  unlikePost: (postId: string) => fetchApi<void>(`/social/posts/${postId}/like`, {
    method: 'DELETE',
  }),
  
  addComment: (postId: string, content: string) => fetchApi<void>(`/social/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
};

// =============================================================================
// CONTENT REPORTS API
// =============================================================================

export const reportsApi = {
  createReport: (data: {
    contentType: string;
    contentId: string;
    reportType: string;
    description?: string;
  }) => fetchApi<ContentReport>('/reports/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getReports: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/reports${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return fetchApi<ContentReport[]>(endpoint) as Promise<PaginatedResponse<ContentReport>>;
  },
  
  moderateReport: (reportId: string, action: ModerationAction) => fetchApi<ContentReport>(`/reports/${reportId}/${action.action}`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNotes: action.adminNotes }),
  }),
};

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return fetchApi<NotificationWithProject[]>(endpoint) as Promise<PaginatedResponse<NotificationWithProject>>;
  },
  
  markAsRead: (notificationId: string) => fetchApi<void>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  }),
  
  markAllAsRead: () => fetchApi<{ count: number }>('/notifications/read-all', {
    method: 'PATCH',
  }),
  
  getUnreadCount: () => fetchApi<{ count: number }>('/notifications/unread-count'),
};

// =============================================================================
// ADMIN API
// =============================================================================

export const adminApi = {
  getStats: () => fetchApi<AdminStats>('/admin/stats'),
  
  getUsers: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return fetchApi<AuthUser[]>(endpoint) as Promise<PaginatedResponse<AuthUser>>;
  },
  
  updateUser: (userId: string, data: Partial<AuthUser>) => fetchApi<AuthUser>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  approveProject: (projectId: string) => fetchApi<Project>(`/admin/projects/${projectId}/approve`, {
    method: 'PATCH',
  }),
  
  rejectProject: (projectId: string, reason?: string) => fetchApi<Project>(`/admin/projects/${projectId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  }),
  
  generateComplianceReport: (period: string) => fetchApi<any>(`/admin/compliance/report`, {
    method: 'POST',
    body: JSON.stringify({ period }),
  }),
};

// =============================================================================
// FILE UPLOAD API
// =============================================================================

export const uploadApi = {
  uploadVideo: (file: File, onProgress?: (progress: number) => void) => {
    return new Promise<ApiResponse<{ url: string; filename: string; size: number }>>((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new ApiError('Invalid response format', xhr.status));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError(errorData.error || 'Upload failed', xhr.status));
          } catch {
            reject(new ApiError(`HTTP ${xhr.status}: ${xhr.statusText}`, xhr.status));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new ApiError('Network error during upload', 0));
      };
      
      xhr.open('POST', `${API_BASE_URL}/upload/video`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  },
  
  uploadImage: (file: File, onProgress?: (progress: number) => void) => {
    return new Promise<ApiResponse<{ url: string; filename: string; size: number }>>((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new ApiError('Invalid response format', xhr.status));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError(errorData.error || 'Upload failed', xhr.status));
          } catch {
            reject(new ApiError(`HTTP ${xhr.status}: ${xhr.statusText}`, xhr.status));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new ApiError('Network error during upload', 0));
      };
      
      xhr.open('POST', `${API_BASE_URL}/upload/image`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  },
};

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const healthApi = {
  check: () => fetchApi<{ message: string; timestamp: string; uptime: number }>('/health'),
};

export { ApiError };