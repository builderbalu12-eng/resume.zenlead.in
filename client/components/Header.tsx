import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Sparkles, FileText, BarChart3, Clock, Wallet, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Upload', path: '/upload', icon: FileText },
    { label: 'Tailor', path: '/tailor', icon: Sparkles },
    { label: 'History', path: '/history', icon: Clock },
    { label: 'Pricing', path: '/pricing', icon: Wallet },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/50 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500">
                <Sparkles className="h-6 w-6 text-white dark:text-slate-900" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                Resume<span className="text-cyan-600">Match</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Pro Intelligence</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                    active
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg shadow-slate-200 dark:shadow-none"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-cyan-500" : "text-slate-300")} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User & Auth */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end pr-4 border-r border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{user.firstName}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">{user.credits} CR</span>
                  </div>
                </div>

                <div className="relative group">
                   <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 border-2 border-transparent group-hover:border-cyan-500 transition-all cursor-pointer">
                      {user.firstName[0]}{user.lastName[0]}
                   </div>
                   
                   {/* Tooltip/Dropdown Menu */}
                   <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest px-6 py-6 shadow-xl shadow-slate-200 dark:shadow-none hover:scale-105 transition-all"
                >
                  Join Now
                </Button>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="lg:hidden pb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                      active
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-400 bg-slate-50 dark:bg-slate-900"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/20"
                >
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
