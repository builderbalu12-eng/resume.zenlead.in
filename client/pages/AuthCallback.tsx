import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from 'lucide-react';

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

        // Decode base64 auth data
        const authDataJson = atob(authDataB64);
        const authData = JSON.parse(authDataJson);

        // Store auth data
        localStorage.setItem('auth_token', authData.access_token);
        
        // Update auth context
        setAuthData(authData.user, authData.access_token);

        // Redirect to dashboard
        setTimeout(() => navigate('/'), 500);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication error';
        setError(message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
          {error ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Authentication Failed
                </h2>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                  {error}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Redirecting you back to login...
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <Loader className="h-8 w-8 text-cyan-600 dark:text-cyan-400 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Completing Sign In
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Please wait while we authenticate your account...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
