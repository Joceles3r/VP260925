import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
export function useAuth() {
    const [authState, setAuthState] = useState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });
    const { data: user, isLoading, error, refetch: refetchUser } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => authApi.getCurrentUser().then(response => response.data),
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        setAuthState({
            user: user || null,
            isAuthenticated: !!user,
            isLoading,
            error: error?.message || null,
        });
    }, [user, isLoading, error]);
    const logout = async () => {
        try {
            await authApi.logout();
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            // Redirect to home page
            window.location.href = '/';
        }
        catch (error) {
            console.error('Logout error:', error);
        }
    };
    const refreshUser = () => {
        refetchUser();
    };
    return {
        ...authState,
        logout,
        refreshUser,
    };
}
