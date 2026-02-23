import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const GoogleSignInButton = ({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
  >
    <div className="group-hover:scale-110 transition-transform duration-300">
      <GoogleIcon />
    </div>
    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
      {isLoading ? 'Connecting...' : 'Sign in with Google'}
    </span>
  </button>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, getGoogleAuthUrl } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
    if (localError) setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      // Error is handled by context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const authUrl = await getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to start Google sign-in');
      setGoogleLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative bg-slate-950 items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Career Growth
          </div>
          
          <h2 className="text-5xl font-black text-white leading-tight mb-6">
            Land your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">dream job</span> with precision.
          </h2>
          
          <p className="text-xl text-slate-400 leading-relaxed mb-12">
            Join thousands of professionals using ResumeMatch to tailor their resumes and beat the ATS systems.
          </p>

          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: ShieldCheck, title: "ATS Optimized", desc: "Beat the filters" },
              { icon: Sparkles, title: "AI Tailoring", desc: "Job-specific matches" }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <feature.icon className="h-8 w-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Logo/Brand for Mobile */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Resume<span className="text-cyan-600">Match</span>
            </h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
              Welcome back
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Please enter your details to sign in
            </p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-red-700 dark:text-red-400 text-sm font-bold">{displayError}</p>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={googleLoading} />

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 bg-white dark:bg-slate-950 text-slate-400 font-bold tracking-widest">
                Or with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  disabled={isLoading}
                  required
                  className="pl-12 py-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-cyan-500 dark:focus:border-cyan-500 bg-slate-50/50 dark:bg-slate-900/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link to="#" className="text-xs font-bold text-cyan-600 hover:text-cyan-700">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  className="pl-12 py-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 focus:border-cyan-500 dark:focus:border-cyan-500 bg-slate-50/50 dark:bg-slate-900/50 transition-all font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-7 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-lg shadow-xl shadow-slate-200 dark:shadow-none transition-all hover:-translate-y-0.5"
            >
              {isLoading ? (
                <Loader className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  Sign In <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-slate-600 dark:text-slate-400 font-medium">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-cyan-600 hover:text-cyan-700 font-black decoration-2 underline-offset-4 hover:underline transition-all"
            >
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
