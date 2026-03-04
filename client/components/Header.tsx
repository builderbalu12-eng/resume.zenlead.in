import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Sparkles, Clock, UserCircle2, Briefcase } from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const initials = useMemo(() => {
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }, [user]);

  const navItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Find Jobs', path: '/findjob', icon: Briefcase },
    { label: 'My Resumes', path: '/history', icon: Clock },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 shrink-0"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden md:block">
            <span className="block text-lg font-bold text-slate-900 whitespace-nowrap">ResumeMatch</span>
          </span>
        </button>

        {/* Desktop Nav Links - always visible on desktop */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = typeof item.icon === 'string' ? null : item.icon;
            const emoji = typeof item.icon === 'string' ? item.icon : null;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-slate-700 hover:bg-gray-100'
                }`}
              >
                {emoji ? (
                  <span className="text-base">{emoji}</span>
                ) : Icon ? (
                  <Icon className="h-5 w-5" />
                ) : null}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile / Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification icon - bell only */}
              <button 
                className="hidden md:inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
                title="Notifications"
              >
                <span className="text-xl">🔔</span>
              </button>

              {/* User profile button */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shrink-0">
                  {initials}
                </span>
                <span className="hidden sm:block text-sm font-medium text-slate-900">
                  {user.firstName}
                </span>
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="whitespace-nowrap">
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} className="whitespace-nowrap">
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - drawer */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-gray-200 bg-white py-3 space-y-2 px-4">
          {navItems.map((item) => {
            const Icon = typeof item.icon === 'string' ? null : item.icon;
            const emoji = typeof item.icon === 'string' ? item.icon : null;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-slate-700 hover:bg-gray-100'
                }`}
              >
                {emoji ? (
                  <span className="text-base">{emoji}</span>
                ) : Icon ? (
                  <Icon className="h-5 w-5" />
                ) : null}
                <span>{item.label}</span>
              </button>
            );
          })}

          {user ? (
            <>
              <button
                onClick={() => {
                  navigate('/profile');
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors"
              >
                <UserCircle2 className="h-5 w-5" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => {
                  navigate('/login');
                  setMenuOpen(false);
                }}
              >
                Login
              </Button>
              <Button 
                className="w-full justify-start" 
                onClick={() => {
                  navigate('/register');
                  setMenuOpen(false);
                }}
              >
                Sign Up
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};
