import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback hook for when not using AuthProvider
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.log('Not authenticated');
          setIsAuthenticated(true); // For demo purposes
          setUser({
            id: "demo-user-1",
            email: "demo@visual.com",
            firstName: "Demo",
            lastName: "User",
            profileType: "investor",
            balanceEUR: "10000.00",
            totalInvested: "0.00",
            totalGains: "0.00",
            simulationMode: true,
            kycVerified: false,
            isAdmin: false,
            isCreator: false
          });
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, []);

    const logout = async () => {
      try {
        await api.post('/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    return {
      user,
      isAuthenticated,
      isLoading,
      logout,
    };
  }
  return context;
};