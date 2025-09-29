import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Hop as Home, ChartBar as BarChart3, FolderOpen, Briefcase, Radio, Users, BookOpen, MessageSquare, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import LanguageSelector from './LanguageSelector';

const navigationItems = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Projets', href: '/projects', icon: FolderOpen },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Live', href: '/live', icon: Radio },
  { name: 'Social', href: '/social', icon: Users },
  { name: 'Livres', href: '/books', icon: BookOpen },
  { name: 'Annonces', href: '/petites-annonces', icon: MessageSquare },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleNavigation('/')}
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              VISUAL
            </button>
            <Badge variant="secondary" className="hidden sm:inline-flex bg-purple-500/20 text-purple-300 border-purple-500/30">
              v2025
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    active 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                2
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-gray-300 hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.firstName?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.firstName || 'Utilisateur'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => handleNavigation('/dashboard')}
                  className="cursor-pointer hover:bg-slate-700 text-gray-300"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleNavigation('/portfolio')}
                  className="cursor-pointer hover:bg-slate-700 text-gray-300"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Portfolio
                </DropdownMenuItem>
                {user?.profileType === 'admin' && (
                  <DropdownMenuItem 
                    onClick={() => handleNavigation('/admin')}
                    className="cursor-pointer hover:bg-slate-700 text-gray-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Administration
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer hover:bg-slate-700 text-red-400"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full justify-start gap-3 ${
                      active 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}