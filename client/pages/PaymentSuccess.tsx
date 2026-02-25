import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type PaymentSource = 'topup' | 'subscription';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateCurrentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [statusText, setStatusText] = useState('Syncing your latest payment status...');

  const source = useMemo<PaymentSource>(() => {
    const raw = searchParams.get('source');
    return raw === 'topup' ? 'topup' : 'subscription';
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const refreshData = async () => {
      try {
        setStatusText('Syncing your latest payment status...');

        // Refresh user data (credits)
        const user = await apiClient.getCurrentUser();
        if (active) {
          updateCurrentUser(user);
        }

        // Trigger subscription refresh for backend/webhook propagation
        if (source === 'subscription') {
          setStatusText('Checking subscription activation...');
          await apiClient.getSubscriptions(0, 20);
        }

        if (!active) return;

        setStatusText('Payment confirmed. Redirecting to your profile...');
        setTimeout(() => {
          if (!active) return;
          navigate(source === 'topup' ? '/profile?tab=history' : '/profile?tab=subscriptions');
        }, 1800);
      } catch {
        if (!active) return;

        // Even if refresh fails (webhook delay/auth refresh lag), allow user to proceed manually.
        setStatusText('Payment received. Your account is syncing. You can continue now.');
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    };

    refreshData();

    return () => {
      active = false;
    };
  }, [navigate, source, updateCurrentUser]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <CheckCircle2 className="h-14 w-14 mx-auto text-green-600 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Payment Successful</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{statusText}</p>

        {isRefreshing ? (
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing...
          </div>
        ) : (
          <Button onClick={() => navigate(source === 'topup' ? '/profile?tab=history' : '/profile?tab=subscriptions')}>
            Go to Profile
          </Button>
        )}
      </div>
    </div>
  );
};
