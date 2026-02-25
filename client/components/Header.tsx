import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Sparkles, FileText, Clock, UserCircle2, Wallet } from 'lucide-react';

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
    { label: 'Dashboard', path: '/', icon: null },
    { label: 'Upload Resume', path: '/upload', icon: FileText },
    { label: 'Tailor Resume', path: '/tailor', icon: Sparkles },
    { label: 'History', path: '/history', icon: Clock },
    { label: 'Pricing', path: '/pricing', icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/70 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-3 lg:gap-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-3xl font-black leading-none text-slate-900 dark:text-slate-100">ResumeMatch</span>
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">AI-Powered Resume Tailoring</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 px-2 py-1.5 sm:px-3 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors"
                  title="Open profile"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden md:block text-left pr-1">
                    <span className="block text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">{user.firstName}</span>
                    <span className="block text-xs text-cyan-700 dark:text-cyan-300">{user.credits} credits</span>
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
                <Button size="sm" onClick={() => navigate('/register')} className="hidden sm:inline-flex">Sign Up</Button>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    isActive(item.path)
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : <UserCircle2 className="h-4 w-4" />}
                  {item.label}
                </button>
              );
            })}
            {user && (
              <>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
