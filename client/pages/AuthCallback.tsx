import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const authDataB64 = searchParams.get('auth_data');
        const success = searchParams.get('success');
        const errorMsg = searchParams.get('error');

        if (errorMsg) {
          setError(decodeURIComponent(errorMsg));
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!success || success !== 'true') {
          setError('Authentication failed');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!authDataB64) {
          setError('No authentication data received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        const authDataJson = atob(authDataB64);
        const authData = JSON.parse(authDataJson);

        localStorage.setItem('auth_token', authData.access_token);
        setAuthData(authData.user, authData.access_token);

        setTimeout(() => navigate('/'), 800);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication error';
        setError(message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    handleCallback();
  }, [searchParams, navigate, setAuthData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-10 text-center space-y-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ShieldCheck className="h-32 w-32" />
          </div>

          {error ? (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 flex items-center justify-center border-2 border-rose-500/20">
                <AlertCircle className="h-10 w-10 text-rose-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Auth Error
                </h2>
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                  <p className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest">
                    {error}
                  </p>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                  Redirecting to Login...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse scale-150" />
                <div className="relative w-24 h-24 mx-auto rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-100 dark:border-slate-700">
                  <Loader className="h-10 w-10 text-cyan-500 animate-spin" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Verifying
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Finalizing your secure session. Please wait while we sync your professional profile.
                </p>
                <div className="flex justify-center gap-1.5 pt-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-6 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-cyan-500 rounded-full animate-loading-bar" style={{ animationDelay: `${i * 0.2}s` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-8">
          ResumeMatch Pro © 2024
        </p>
      </div>
    </div>
  );
};
