import React, { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useLocation } from 'wouter';
import OverdraftManagementPage from '@/components/overdraft/OverdraftManagementPage';

const OverdraftManagement: React.FC = () => {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50" data-testid="overdraft-management-page">
      <OverdraftManagementPage />
    </main>
  );
};

export default OverdraftManagement;