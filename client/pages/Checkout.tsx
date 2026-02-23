import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Check, Zap, ShieldCheck, CreditCard, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, SubscriptionPlan } from '@/services/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams.get('plan');
  const currency = searchParams.get('currency') || 'USD';

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      navigate('/pricing');
      return;
    }

    const loadPlan = async () => {
      try {
        setIsLoading(true);
        const planData = await apiClient.getSubscriptionPlan(planId);
        setPlan(planData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plan');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [planId, navigate]);

  const handleSubscribe = async () => {
    if (!plan || !user) {
      setError('Invalid subscription data');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create subscription via backend
      const response = await apiClient.createSubscription(plan._id, user._id);

      if (!response.short_url) {
        throw new Error('Failed to generate payment link');
      }

      // Redirect to Razorpay checkout
      window.location.href = response.short_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="h-20 w-20 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin border-t-cyan-500" />
            <Loader className="h-8 w-8 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-black animate-pulse uppercase tracking-widest text-sm">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <div className="h-20 w-20 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Plan not found</h2>
          <p className="text-slate-500 font-medium mb-8">The requested subscription plan could not be located.</p>
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full py-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black"
          >
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pricing')}
          className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black mb-12 transition-all"
        >
          <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm uppercase tracking-widest">Back to Plans</span>
        </button>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Checkout Section */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-10 md:p-12">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <CreditCard className="h-6 w-6 text-cyan-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Checkout
                </h1>
              </div>

              {/* Order Item */}
              <div className="space-y-8 pb-10 border-b-2 border-slate-50 dark:border-slate-800">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {plan.plan_name}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm max-w-md">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {plan.amount} <span className="text-sm font-bold text-slate-400 uppercase">{currency}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">/ {plan.period}</p>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Subscription Benefits</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      `${plan.credits_per_cycle} AI credits per cycle`,
                      'ATS-optimized templates',
                      'Keyword matching analysis',
                      'Priority support access',
                      'Unlimited PDF downloads',
                      'Job-specific tailoring'
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Check className="h-3 w-3 text-emerald-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="py-10 space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Account</p>
                <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs font-bold text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Logged In</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-8 p-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-rose-500 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-rose-700 dark:text-rose-400 text-sm font-black">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-8 py-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="flex items-center gap-2">
                 <Lock className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">SSL Secure</span>
               </div>
               <div className="flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Razorpay Protected</span>
               </div>
            </div>
          </div>

          {/* Sticky Summary Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-slate-900 dark:bg-white rounded-[2.5rem] shadow-2xl p-10 text-white dark:text-slate-900 space-y-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary</p>
                <h3 className="text-3xl font-black tracking-tight">Order Total</h3>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Plan</span>
                  <span className="font-black text-lg uppercase tracking-tight">{plan.plan_name}</span>
                </div>
                <div className="flex justify-between items-center pb-8 border-b border-slate-800 dark:border-slate-200">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Interval</span>
                  <span className="font-black text-lg capitalize tracking-tight">{plan.period}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total to pay</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-cyan-400 dark:text-cyan-600">
                        {plan.amount}
                      </span>
                      <span className="font-bold text-slate-400 uppercase">{currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full py-9 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xl shadow-2xl shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader className="h-6 w-6 animate-spin" />
                      <span>Confirming...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Secure Payment</span>
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </Button>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                      By clicking "Secure Payment", you agree to the Terms of Service. Your subscription will renew automatically.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-4 w-4 text-cyan-500 mt-0.5" />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                      Instant access to {plan.credits_per_cycle} credits after successful payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
