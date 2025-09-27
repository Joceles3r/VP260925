const API_BASE_URL = '/api';
class ApiError extends Error {
    constructor(message, status, details) {
        super(message);
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "details", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: details
        });
        this.name = 'ApiError';
    }
}
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
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
            }
            catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new ApiError(errorMessage, response.status, errorDetails);
        }
        return await response.json();
    }
    catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network or other errors
        throw new ApiError('Network error. Please check your connection and try again.', 0);
    }
}
// =============================================================================
// AUTHENTICATION API
// =============================================================================
export const authApi = {
    getCurrentUser: () => fetchApi('/auth/me'),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),
};
// =============================================================================
// PROJECTS API
// =============================================================================
export const projectsApi = {
    getProjects: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/projects${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return fetchApi(endpoint);
    },
    getProject: (id) => fetchApi(`/projects/${id}`),
    createProject: (data) => fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProject: (id, data) => fetchApi(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteProject: (id) => fetchApi(`/projects/${id}`, {
        method: 'DELETE',
    }),
};
// =============================================================================
// INVESTMENTS API
// =============================================================================
export const investmentsApi = {
    createInvestment: (data) => fetchApi('/investments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getMyInvestments: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/investments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return fetchApi(endpoint);
    },
    getInvestment: (id) => fetchApi(`/investments/${id}`),
};
// =============================================================================
// SOCIAL API
// =============================================================================
export const socialApi = {
    getPosts: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/social/posts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return fetchApi(endpoint);
    },
    createPost: (data) => fetchApi('/social/posts', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    likePost: (postId) => fetchApi(`/social/posts/${postId}/like`, {
        method: 'POST',
    }),
    unlikePost: (postId) => fetchApi(`/social/posts/${postId}/like`, {
        method: 'DELETE',
    }),
    addComment: (postId, content) => fetchApi(`/social/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    }),
};
// =============================================================================
// CONTENT REPORTS API
// =============================================================================
export const reportsApi = {
    createReport: (data) => fetchApi('/reports/create', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getReports: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/reports${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return fetchApi(endpoint);
    },
    moderateReport: (reportId, action) => fetchApi(`/reports/${reportId}/${action.action}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes: action.adminNotes }),
    }),
};
// =============================================================================
// NOTIFICATIONS API
// =============================================================================
export const notificationsApi = {
    getNotifications: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return fetchApi(endpoint);
    },
    markAsRead: (notificationId) => fetchApi(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
    }),
    markAllAsRead: () => fetchApi('/notifications/read-all', {
        method: 'PATCH',
    }),
    getUnreadCount: () => fetchApi('/notifications/unread-count'),
};
// =============================================================================
// ADMIN API
// =============================================================================
export const adminApi = {
    getStats: () => fetchApi('/admin/stats'),
    getUsers: (params) => {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return fetchApi(endpoint);
    },
    updateUser: (userId, data) => fetchApi(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    approveProject: (projectId) => fetchApi(`/admin/projects/${projectId}/approve`, {
        method: 'PATCH',
    }),
    rejectProject: (projectId, reason) => fetchApi(`/admin/projects/${projectId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    }),
    generateComplianceReport: (period) => fetchApi(`/admin/compliance/report`, {
        method: 'POST',
        body: JSON.stringify({ period }),
    }),
};
// =============================================================================
// FILE UPLOAD API
// =============================================================================
export const uploadApi = {
    uploadVideo: (file, onProgress) => {
        return new Promise((resolve, reject) => {
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
                    }
                    catch (error) {
                        reject(new ApiError('Invalid response format', xhr.status));
                    }
                }
                else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new ApiError(errorData.error || 'Upload failed', xhr.status));
                    }
                    catch {
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
    uploadImage: (file, onProgress) => {
        return new Promise((resolve, reject) => {
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
                    }
                    catch (error) {
                        reject(new ApiError('Invalid response format', xhr.status));
                    }
                }
                else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new ApiError(errorData.error || 'Upload failed', xhr.status));
                    }
                    catch {
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
    check: () => fetchApi('/health'),
};
export { ApiError };
