import React from 'react';
import { Link, useLocation } from 'wouter';
import { Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import NotificationPanel from './NotificationPanel';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { SearchBar } from './SearchBar';

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', section: 'dashboard' },
    { path: '/visual', label: 'VISUAL', section: 'visual', highlight: true },
    { path: '/projects', label: 'Projets', section: 'projects' },
    { path: '/portfolio', label: 'Portfolio', section: 'portfolio' },
    { path: '/live', label: 'Live', section: 'live' },
    { path: '/wallet', label: 'Portefeuille', section: 'wallet' },
    { path: '/social', label: 'Social', section: 'social' },
    { path: '/leaderboard', label: '🏆 Classement', section: 'leaderboard', highlight: true },
    { path: '/receipts', label: 'Reçus', section: 'receipts' },
    { path: '/info', label: 'Info', section: 'info' },
    ...(user?.profileType === 'admin' ? [
      { path: '/admin', label: 'Admin', section: 'admin' },
      { path: '/admin/dashboard', label: '⚡ Dashboard', section: 'admin-dashboard', highlight: true },
    ] : []),
  ];

  return (
    <nav className="glass-card border-b border-border/30 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="flex items-center group" data-testid="logo-link">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00D1FF] to-[#7B2CFF] rounded-lg flex items-center justify-center neon-glow-blue smooth-transition group-hover:scale-110">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold visual-text-gradient">VISUAL</span>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <SearchBar />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium smooth-transition ${
                    location === item.path
                      ? 'bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] text-white neon-glow-blue'
                      : item.highlight
                      ? 'text-[#00D1FF] hover:text-white hover:bg-[#00D1FF]/10 border border-[#00D1FF]/30 hover:border-[#00D1FF]/50 neon-border'
                      : 'text-foreground hover:bg-muted/50 hover:text-[#00D1FF]'
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
            <Link href="/profile" className="flex items-center space-x-3 px-3 py-1.5 rounded-lg glass-card smooth-transition hover:border-[#7B2CFF]/50 hover:neon-glow-violet" data-testid="user-menu">
              <div className="w-9 h-9 bg-gradient-to-br from-[#7B2CFF] to-[#FF3CAC] rounded-full flex items-center justify-center neon-glow-violet smooth-transition hover:scale-110 cursor-pointer">
                <span className="text-sm font-bold text-white" data-testid="user-avatar">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="hidden lg:block">
                <span className="text-sm font-medium text-foreground block" data-testid="user-name">
                  {user?.firstName || user?.email || 'User'}
                </span>
                {user?.kycVerified && (
                  <div className="text-xs bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 px-2 py-0.5 rounded-full inline-flex items-center mt-0.5" data-testid="kyc-verified">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    KYC Vérifié
                  </div>
                )}
              </div>
            </Link>
            
            {/* Notifications */}
            <NotificationPanel />
            
            {/* Language Selector */}
            <LanguageSelector showLabel={false} />
            
            {/* Theme Toggle */}
            <ThemeToggle showLabel={false} saveToServer={true} />
          </div>
        </div>
      </div>
    </nav>
  );
}
