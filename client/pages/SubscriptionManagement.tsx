import React, { useState, useEffect } from 'react';
import { Loader, CreditCard, Zap, Calendar, X, ArrowLeft, ShieldCheck, Crown, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Subscription } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSubscriptions(0, 100);
        setSubscriptions(response.data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscriptions();
  }, []);

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setCancelingId(subscriptionId);
      await apiClient.cancelSubscription(subscriptionId);
      setSubscriptions(subs => subs.filter(s => s._id !== subscriptionId));
      setConfirmCancel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'paused':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-600 border-rose-200';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin border-t-cyan-500" />
            <Loader className="h-10 w-10 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Checking Subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black transition-all uppercase tracking-widest text-xs"
            >
               <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
                 <ArrowLeft className="h-4 w-4" />
               </div>
               Dashboard
            </button>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">Subscriptions</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Take control of your premium features and billing cycle in one place.
            </p>
          </div>
          <Button
            onClick={() => navigate("/pricing")}
            className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 px-8 flex items-center gap-2 group shadow-xl transition-all"
          >
            Upgrade Plan <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-12 p-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <div className="bg-rose-500 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <p className="text-rose-700 dark:text-rose-400 font-black text-sm">{error}</p>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {subscriptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-24 text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-10">
              <div className="h-32 w-32 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-700">
                <Crown className="h-12 w-12 text-slate-200" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">No active plans</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">You're currently enjoying our free tier benefits. Upgrade to unlock the full potential of AI resume tailoring.</p>
              </div>
              <Button
                onClick={() => navigate("/pricing")}
                className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black px-12 py-7 text-lg shadow-xl shadow-emerald-500/20"
              >
                Explore Premium
              </Button>
            </div>
          ) : (
            subscriptions.map(subscription => (
              <div
                key={subscription._id}
                className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                   <ShieldCheck className="h-48 w-48" />
                </div>

                <div className="flex flex-col lg:flex-row gap-12 items-start relative z-10">
                  <div className="flex-1 space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
                        <Zap className="h-10 w-10 text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-4">
                           <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Subscription
                          </h3>
                          <div className={cn(
                            "px-4 py-1.5 rounded-full font-black text-[10px] border-2 uppercase tracking-[0.2em]",
                            getStatusColor(subscription.status)
                          )}>
                            {subscription.status}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">REF: {subscription._id.substring(0, 12)}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8 pt-10 border-t-2 border-slate-50 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Benefit Tier</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white capitalize">
                           {subscription.plan_id || 'Standard'}
                        </p>
                      </div>
                      {subscription.current_period_start && (
                        <div>
                          <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Cycle Start</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            {new Date(subscription.current_period_start).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {subscription.current_period_end && (
                        <div>
                          <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Calendar className="h-3 w-3" /> Next Billing
                          </p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            {new Date(subscription.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest pt-4">
                       <Calendar className="h-4 w-4" /> Member since {new Date(subscription.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="w-full lg:w-72 self-stretch flex flex-col justify-between">
                    {subscription.status !== 'cancelled' ? (
                      <>
                        {confirmCancel === subscription._id ? (
                          <div className="space-y-4 bg-rose-50 dark:bg-rose-950/20 p-8 rounded-3xl border-2 border-rose-100 dark:border-rose-900 animate-in zoom-in-95 duration-200 shadow-2xl shadow-rose-500/10">
                            <h4 className="font-black text-rose-900 dark:text-rose-400 text-lg">Cancel?</h4>
                            <p className="text-[10px] text-rose-700 font-bold uppercase tracking-widest leading-relaxed">You will retain access until the end of the billing period.</p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCancelSubscription(subscription._id)}
                                disabled={cancelingId === subscription._id}
                                className="flex-1 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs"
                              >
                                {cancelingId === subscription._id ? '...' : 'Confirm'}
                              </Button>
                              <Button
                                onClick={() => setConfirmCancel(null)}
                                className="flex-1 py-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-xs"
                              >
                                Back
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setConfirmCancel(subscription._id)}
                            variant="outline"
                            className="w-full py-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3"
                          >
                            <Trash2 className="h-4 w-4" /> Cancel Subscription
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={() => navigate("/pricing")}
                        className="w-full py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20"
                      >
                        Reactive Account
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
