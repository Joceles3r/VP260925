import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LanguageSelector from '@/components/LanguageSelector';
import { 
  Home, 
  BarChart3, 
  FolderOpen, 
  Briefcase, 
  Radio, 
  Users, 
  Shield,
  LogOut 
} from 'lucide-react';

const Navigation = () => {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { t, formatCurrency } = useI18n();

  const navigationItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.dashboard'), href: '/dashboard', icon: BarChart3 },
    { name: t('nav.projects'), href: '/projects', icon: FolderOpen },
    { name: t('nav.portfolio'), href: '/portfolio', icon: Briefcase },
    { name: t('nav.live'), href: '/live', icon: Radio },
    { name: t('nav.social'), href: '/social', icon: Users },
  ];

  if (user?.isAdmin) {
    navigationItems.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">VISUAL</h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`${
                      isActive
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  Balance: {formatCurrency(parseFloat(user?.balanceEUR || '0'))}
                </p>
              </div>
              <Avatar>
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;