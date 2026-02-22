import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Sparkles, FileText, BarChart3, Clock } from 'lucide-react';
import { useState } from 'react';

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

  const navItems = [
    { label: 'Dashboard', path: '/', icon: null },
    { label: 'Upload Resume', path: '/upload', icon: FileText },
    { label: 'Tailor Resume', path: '/tailor', icon: Sparkles },
    { label: 'History', path: '/history', icon: Clock },
  ];

  return (
    <header className="bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                ResumeMatch
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">AI-Powered Resume Tailoring</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 text-cyan-700 dark:text-cyan-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Info and Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-800">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                      <p className="text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                        {user.credits} credits
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="hidden sm:inline-flex px-4 py-2.5 font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-lg transition-all duration-200"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 text-cyan-700 dark:text-cyan-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </button>
                );
              })}
              {!user && (
                <>
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                      onClick={() => {
                        navigate('/login');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        navigate('/register');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all"
                    >
                      Sign Up
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
