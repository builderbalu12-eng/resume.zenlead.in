import React, { useState, useEffect } from 'react';
import { Loader, CreditCard, Zap, Gift, History, Settings, TrendingUp, Calendar, AlertCircle, CheckCircle2, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, SubscriptionPlan, Subscription, PaymentLog } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'CAD'];
const CREDIT_PACKAGES = [
  { credits: 50, amount: 2, desc: "Starter pack for quick fixes" },
  { credits: 150, amount: 6, popular: true, desc: "Most popular for active seekers" },
  { credits: 500, amount: 19, desc: "Power user pack for bulk applications" },
  { credits: 1000, amount: 35, desc: "Corporate level credit supply" },
];

type TabType = 'plans' | 'subscriptions' | 'one-time' | 'history';

export const PricingHub: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [currency, setCurrency] = useState('INR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  // One-time payment state
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]);
  const [customCredits, setCustomCredits] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment history state
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (activeTab === 'plans') {
          const response = await apiClient.getSubscriptionPlans(0, 100, true);
          setPlans(response.data?.items || []);
        } else if (activeTab === 'subscriptions' && isAuthenticated) {
          const response = await apiClient.getSubscriptions(0, 100);
          setSubscriptions(response.data?.items || []);
        } else if (activeTab === 'history' && isAuthenticated) {
          const response = await apiClient.getPaymentLogs(0, 100);
          const items = response.data?.items || [];
          setLogs(items);

          let spent = 0;
          let credits = 0;
          items.forEach((log: PaymentLog) => {
            if (log.status === 'success' || log.status === 'succeeded') {
              spent += log.amount_paid;
              credits += log.credits_added;
            }
          });
          setTotalSpent(spent);
          setTotalCredits(credits);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, isAuthenticated]);

  const getConvertedAmount = (amount: number): string => {
    if (currency === 'USD') return amount.toFixed(2);
    if (currency === 'INR') return (amount * 83).toFixed(0);
    if (currency === 'EUR') return (amount * 0.92).toFixed(2);
    if (currency === 'GBP') return (amount * 0.79).toFixed(2);
    if (currency === 'CAD') return (amount * 1.36).toFixed(2);
    return amount.toFixed(2);
  };

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

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      setError('Please sign in to subscribe');
      return;
    }
    try {
      setIsProcessing(true);
      const response = await apiClient.createSubscription(plan._id as string, user!._id);
      if (response.short_url) {
        window.location.href = response.short_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
      setIsProcessing(false);
    }
  };

  const handleOneTimePayment = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to purchase credits');
      return;
    }

    const pkg = customCredits
      ? { credits: customCredits, amount: customAmount || 0 }
      : selectedPackage;

    if (!pkg || pkg.credits === 0) {
      setError('Please select a package');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await apiClient.createPaymentOrder(
        pkg.amount,
        currency,
        pkg.credits,
        `credits_${user!._id}_${Date.now()}`
      );

      if (response.data?.order_id) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          order_id: response.data.order_id,
          description: response.data.description,
          handler: async (razorpayResponse: any) => {
            try {
              await apiClient.verifyPayment(
                razorpayResponse.razorpay_payment_id,
                razorpayResponse.razorpay_order_id,
                razorpayResponse.razorpay_signature
              );
              // Success
              setError(null);
              alert('Payment successful! Credits added to your account.');
              setActiveTab('history');
            } catch (err) {
              setError('Payment verification failed');
            }
          },
          prefill: {
            email: user?.email,
            name: `${user?.firstName} ${user?.lastName}`,
          },
          theme: { color: '#06B6D4' },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomCredits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || null;
    setCustomCredits(value);
    if (value) {
      const baseAmount = (value / 50) * 2;
      setCustomAmount(baseAmount);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setAppliedCoupon({ code: couponCode });
    } catch (err) {
      setError('Invalid coupon code');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'success':
      case 'succeeded':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'pending':
      case 'created':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'cancelled':
      case 'failed':
        return 'bg-rose-500/10 text-rose-600 border-rose-200';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 pt-32 pb-48 px-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Sparkles className="h-4 w-4" />
              Upgrade Your Career Path
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Pricing & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Payments</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Choose the perfect plan to boost your job applications and beat the ATS filters with AI-powered precision.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-20">
        {/* Navigation / Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 mb-12 flex flex-wrap gap-2 items-center border border-slate-200 dark:border-slate-800">
          {[
            { id: 'plans' as TabType, label: 'Subscription Plans', icon: Crown },
            { id: 'subscriptions' as TabType, label: 'Manage Active', icon: Settings },
            { id: 'one-time' as TabType, label: 'Add Credits', icon: Zap },
            { id: 'history' as TabType, label: 'Billing History', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 rounded-xl font-black text-sm transition-all duration-300 flex-1 min-w-[160px]",
                  isActive 
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "animate-bounce" : "")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Currency Selector (for relevant tabs) */}
        {(activeTab === 'plans' || activeTab === 'one-time') && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
                    currency === curr
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-200 dark:shadow-none"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-rose-500 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-rose-900 dark:text-rose-400 font-black">Something went wrong</h4>
                <p className="text-rose-700 dark:text-rose-500 text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content Rendering */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-32 text-center shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="relative inline-block">
              <div className="h-20 w-20 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin border-t-cyan-500" />
              <Loader className="h-8 w-8 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-8 text-slate-500 font-bold text-lg animate-pulse">Loading amazing deals...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            
            {/* PLANS TAB */}
            {activeTab === 'plans' && (
              <div className="space-y-12">
                <div className="grid lg:grid-cols-2 gap-8">
                  {plans.length === 0 ? (
                    <div className="col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <CreditCard className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                      <p className="text-slate-500 font-bold text-xl">No active plans available right now.</p>
                    </div>
                  ) : (
                    plans.map((plan) => (
                      <div
                        key={plan._id}
                        className="group relative bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col"
                      >
                        {/* Popular Badge placeholder if needed */}
                        <div className="absolute top-0 right-0 p-8">
                          <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500 transition-colors duration-500">
                            <ArrowRight className="h-6 w-6 text-slate-400 group-hover:text-white -rotate-45" />
                          </div>
                        </div>

                        <div className="space-y-8 flex-1">
                          <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {plan.plan_name}
                            </h3>
                            <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                              {plan.description}
                            </p>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-black text-slate-900 dark:text-white">
                              {getConvertedAmount(plan.amount)}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xl font-bold text-cyan-500">{currency}</span>
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/ {plan.period}</span>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              <Zap className="h-8 w-8 text-cyan-500 mb-4" />
                              <p className="text-2xl font-black text-slate-900 dark:text-white">{plan.credits_per_cycle}</p>
                              <p className="text-xs font-bold text-slate-500 uppercase">Monthly Credits</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              <Crown className="h-8 w-8 text-blue-500 mb-4" />
                              <p className="text-2xl font-black text-slate-900 dark:text-white">Pro</p>
                              <p className="text-xs font-bold text-slate-500 uppercase">Feature Tier</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">What's included:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {['ATS Optimization', 'AI Tailoring', 'Unlimited PDF Export', 'Priority Queue', 'Dedicated Support'].map((feat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  </div>
                                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-12">
                          <Button
                            onClick={() => handleSelectPlan(plan)}
                            disabled={isProcessing || !isAuthenticated}
                            className="w-full py-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-black hover:scale-[1.02] transition-transform shadow-2xl disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader className="h-6 w-6 animate-spin" />
                            ) : isAuthenticated ? (
                              'Start My Journey'
                            ) : (
                              'Sign In to Begin'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Coupon Panel */}
                <div className="max-w-2xl mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2.5rem] p-1 shadow-2xl shadow-cyan-500/20">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.4rem] p-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-cyan-500/10 p-6 rounded-3xl">
                      <Gift className="h-10 w-10 text-cyan-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Special Offer?</h3>
                      <p className="text-slate-500 font-medium">Enter your promo code below to unlock savings.</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-3">
                      <Input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="CODE2024"
                        className="flex-1 min-w-[150px] py-6 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:border-cyan-500 transition-all font-black text-center"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        className="py-6 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black shadow-lg"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  {appliedCoupon && (
                    <div className="text-center py-4">
                      <p className="text-white font-black animate-bounce">
                        🔥 "{appliedCoupon.code}" UNLOCKED!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {!isAuthenticated ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-20 text-center shadow-xl border border-slate-200 dark:border-slate-800">
                    <Crown className="h-20 w-20 text-slate-200 mx-auto mb-8" />
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Identify Yourself</h2>
                    <p className="text-slate-500 font-medium mb-10">Please sign in to manage your premium benefits.</p>
                    <a href="/login">
                      <Button className="px-10 py-6 rounded-2xl bg-slate-900 text-white font-black shadow-xl">
                        Go to Sign In
                      </Button>
                    </a>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-20 text-center shadow-xl border border-slate-200 dark:border-slate-800">
                    <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                      <CreditCard className="h-10 w-10 text-slate-300" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">No active plans found</h2>
                    <p className="text-slate-500 font-medium mb-10">You're currently on the free tier. Experience the pro features today.</p>
                    <Button
                      onClick={() => setActiveTab('plans')}
                      className="px-10 py-6 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black shadow-xl shadow-cyan-200 dark:shadow-none"
                    >
                      Browse Plans
                    </Button>
                  </div>
                ) : (
                  subscriptions.map(subscription => (
                    <div
                      key={subscription._id}
                      className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row gap-12 items-start">
                        <div className="flex-1 space-y-10">
                          <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/20">
                              <Zap className="h-10 w-10 text-cyan-500" />
                            </div>
                            <div>
                              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {subscription.plan?.plan_name || 'Active Plan'}
                              </h3>
                              <div className={cn(
                                "inline-flex px-4 py-1.5 rounded-full font-black text-xs border-2 uppercase tracking-widest mt-2",
                                getStatusColor(subscription.status)
                              )}>
                                {subscription.status}
                              </div>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-8 pt-10 border-t-2 border-slate-50 dark:border-slate-800">
                            <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cycle Benefit</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">
                                {subscription.plan?.credits_per_cycle || 0} Credits
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Period</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white capitalize">
                                Every {subscription.plan?.period || 'Month'}
                              </p>
                            </div>
                            {subscription.current_period_end && (
                              <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" /> Renewal Date
                                </p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                  {new Date(subscription.current_period_end).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-full md:w-auto self-stretch flex flex-col justify-between">
                          {subscription.status !== 'cancelled' && (
                            <>
                              {confirmCancel === subscription._id ? (
                                <div className="space-y-4 bg-rose-50 dark:bg-rose-950/20 p-8 rounded-3xl border-2 border-rose-100 dark:border-rose-900 animate-in zoom-in-95 duration-200">
                                  <h4 className="font-black text-rose-900 dark:text-rose-400 text-lg">Are you sure?</h4>
                                  <p className="text-sm text-rose-700 font-medium">You'll lose your pro benefits at the end of the current cycle.</p>
                                  <div className="flex gap-3">
                                    <Button
                                      onClick={() => handleCancelSubscription(subscription._id)}
                                      disabled={cancelingId === subscription._id}
                                      className="flex-1 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm"
                                    >
                                      {cancelingId === subscription._id ? '...' : 'Yes, Cancel'}
                                    </Button>
                                    <Button
                                      onClick={() => setConfirmCancel(null)}
                                      className="flex-1 py-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm"
                                    >
                                      Stay Pro
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setConfirmCancel(subscription._id)}
                                  className="w-full py-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all font-black"
                                >
                                  Cancel Subscription
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ONE-TIME PAYMENT TAB */}
            {activeTab === 'one-time' && (
              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-cyan-500" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Power Up Instantly
                      </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {CREDIT_PACKAGES.map((pkg) => (
                        <button
                          key={pkg.credits}
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setCustomCredits(null);
                          }}
                          className={cn(
                            "relative group p-8 rounded-[2rem] border-2 text-left transition-all duration-300",
                            selectedPackage?.credits === pkg.credits && !customCredits
                              ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 shadow-xl shadow-cyan-200 dark:shadow-none"
                              : "border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/30"
                          )}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-3 left-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg">
                              Best Value
                            </div>
                          )}
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{pkg.credits}</span>
                              <div className={cn(
                                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                selectedPackage?.credits === pkg.credits && !customCredits 
                                  ? "border-cyan-500 bg-cyan-500 shadow-lg" 
                                  : "border-slate-200 bg-white"
                              )}>
                                {selectedPackage?.credits === pkg.credits && !customCredits && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </div>
                            </div>
                            <div>
                              <p className="text-lg font-black text-slate-900 dark:text-white">
                                {getConvertedAmount(pkg.amount)} <span className="text-sm font-bold text-slate-400">{currency}</span>
                              </p>
                              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{pkg.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-xl border border-slate-200 dark:border-slate-800">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
                      Custom Refill
                    </h2>
                    <div className="relative">
                      <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                      <Input
                        type="number"
                        value={customCredits || ''}
                        onChange={handleCustomCredits}
                        placeholder="How many credits do you need?"
                        className="w-full py-8 pl-16 pr-8 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 focus:border-cyan-500 font-black text-xl"
                        min="1"
                        max="50000"
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-12 bg-slate-900 dark:bg-white rounded-[2.5rem] p-10 shadow-2xl text-white dark:text-slate-900 space-y-10">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Purchase Details</p>
                      <h3 className="text-3xl font-black tracking-tight">Order Summary</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Total Credits</span>
                        <span className="text-2xl font-black">{customCredits || selectedPackage?.credits || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pb-6 border-b border-slate-800 dark:border-slate-200">
                        <span className="text-slate-400 font-bold">Base Price</span>
                        <span className="text-2xl font-black">{getConvertedAmount(customAmount || selectedPackage?.amount || 0)} {currency}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Amount</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-cyan-400 dark:text-cyan-600">
                              {getConvertedAmount(customAmount || selectedPackage?.amount || 0)}
                            </span>
                            <span className="font-bold text-slate-400">{currency}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleOneTimePayment}
                      disabled={isProcessing || !isAuthenticated || (customCredits === null && selectedPackage?.credits === 0)}
                      className="w-full py-8 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xl shadow-2xl shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader className="h-6 w-6 animate-spin" />
                      ) : (
                        'Confirm & Pay'
                      )}
                    </Button>

                    <div className="space-y-4 pt-4">
                      {[
                        "Credits added instantly",
                        "No expiration date",
                        "Secure 256-bit encryption"
                      ].map((info, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{info}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="space-y-12 max-w-5xl mx-auto">
                {!isAuthenticated ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-20 text-center shadow-xl border border-slate-200 dark:border-slate-800">
                    <History className="h-20 w-20 text-slate-200 mx-auto mb-8" />
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">View Your Activity</h2>
                    <p className="text-slate-500 font-medium mb-10">Sign in to track your investments in your future.</p>
                    <a href="/login">
                      <Button className="px-10 py-6 rounded-2xl bg-slate-900 text-white font-black shadow-xl">
                        Identify Yourself
                      </Button>
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border-2 border-emerald-500/20">
                            <TrendingUp className="h-8 w-8 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Career Investment</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                              ${totalSpent.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border-2 border-cyan-500/20">
                            <Zap className="h-8 w-8 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Credits Earned</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                              {totalCredits} <span className="text-lg text-slate-400 uppercase">Power</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {logs.length === 0 ? (
                        <div className="p-32 text-center">
                          <History className="h-20 w-20 text-slate-100 dark:text-slate-800 mx-auto mb-8" />
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            No billing history yet
                          </h3>
                          <p className="text-slate-500 font-medium">Your future transactions will appear here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-10 py-8 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-10 py-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Investment</th>
                                <th className="px-10 py-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Benefit</th>
                                <th className="px-10 py-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {logs.map((log) => (
                                <tr key={log._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-10 py-8 text-slate-900 dark:text-white font-black">
                                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td className="px-10 py-8 text-right">
                                    <span className="text-slate-900 dark:text-white font-black text-lg">
                                      {log.amount_paid.toFixed(2)}
                                    </span>
                                    <span className="ml-1 text-xs font-bold text-slate-400 uppercase">{log.currency}</span>
                                  </td>
                                  <td className="px-10 py-8 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Zap className="h-4 w-4 text-cyan-500" />
                                      <span className="text-slate-900 dark:text-white font-black text-lg">+{log.credits_added}</span>
                                    </div>
                                  </td>
                                  <td className="px-10 py-8 text-center">
                                    <span className={cn(
                                      "inline-flex px-4 py-1.5 rounded-full font-black text-[10px] border-2 uppercase tracking-widest",
                                      getStatusColor(log.status)
                                    )}>
                                      {log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
};
