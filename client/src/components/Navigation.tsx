import React from 'react';
import { Link, useLocation } from 'wouter';
import { Play, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import NotificationPanel from './NotificationPanel';

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', section: 'dashboard' },
    { path: '/projects', label: 'Projets', section: 'projects' },
    { path: '/portfolio', label: 'Portfolio', section: 'portfolio' },
    { path: '/live', label: 'Live', section: 'live' },
    { path: '/wallet', label: 'Portefeuille', section: 'wallet' },
    { path: '/social', label: 'Social', section: 'social' },
    { path: '/receipts', label: 'Reçus', section: 'receipts' },
    ...(user?.profileType === 'admin' ? [{ path: '/admin', label: 'Admin', section: 'admin' }] : []),
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="flex items-center" data-testid="logo-link">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="ml-3 text-xl font-bold text-foreground">VISUAL</span>
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  data-testid={`nav-${item.section}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center">
                <span className="text-sm font-medium" data-testid="user-avatar">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground" data-testid="user-name">
                {user?.firstName || user?.email || 'User'}
              </span>
              {user?.kycVerified && (
                <div className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full" data-testid="kyc-verified">
                  ✓ KYC Vérifié
                </div>
              )}
            </div>
            
            {/* Notifications */}
            <NotificationPanel />
            
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="settings-button"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
