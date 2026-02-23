import React, { useState, useEffect } from 'react';
import { Loader, CreditCard, Zap, Gift, History, Settings, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, SubscriptionPlan, Subscription, PaymentLog } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'CAD'];
const CREDIT_PACKAGES = [
  { credits: 50, amount: 2 },
  { credits: 150, amount: 6, popular: true },
  { credits: 500, amount: 19 },
  { credits: 1000, amount: 35 },
];

type TabType = 'plans' | 'subscriptions' | 'one-time' | 'history';

export const PricingHub: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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
          setPlans(response.data.items || []);
        } else if (activeTab === 'subscriptions' && isAuthenticated) {
          const response = await apiClient.getSubscriptions(0, 100);
          setSubscriptions(response.data.items || []);
        } else if (activeTab === 'history' && isAuthenticated) {
          const response = await apiClient.getPaymentLogs(0, 100);
          const items = response.data?.items || response.items || [];
          setLogs(items);

          let spent = 0;
          let credits = 0;
          items.forEach((log: PaymentLog) => {
            if (log.status === 'succeeded') {
              spent += log.amount_paid;
              credits += log.credits_added;
            }
          });
          setTotalSpent(spent);
          setTotalCredits(credits);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
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
      const response = await apiClient.createSubscription(plan.razorpay_plan_id, user!._id);
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
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'succeeded':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black text-slate-900 dark:text-slate-100 mb-2">
            Pricing & Payments
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage your subscriptions, credits, and payment history
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b-2 border-slate-200 dark:border-slate-800 pb-4">
          {[
            { id: 'plans' as TabType, label: 'Pricing Plans', icon: CreditCard },
            { id: 'subscriptions' as TabType, label: 'My Subscriptions', icon: Settings },
            { id: 'one-time' as TabType, label: 'Buy Credits', icon: Gift },
            { id: 'history' as TabType, label: 'Payment History', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Currency Selector (for plans and one-time) */}
        {(activeTab === 'plans' || activeTab === 'one-time') && (
          <div className="flex justify-end mb-6">
            <div className="inline-flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-4">Currency:</span>
              <div className="flex gap-1">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-2 rounded-md font-bold text-sm transition-all ${
                      currency === curr
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <Loader className="h-12 w-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
          </div>
        )}

        {/* TAB CONTENT */}

        {/* PLANS TAB */}
        {activeTab === 'plans' && !isLoading && (
          <div className="space-y-8">
            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {plans.length === 0 ? (
                <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No plans available</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div
                    key={plan._id}
                    className="group relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 dark:from-cyan-500/10 dark:to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-8 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {plan.plan_name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {plan.description}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                            {plan.amount}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">
                            {currency}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Per {plan.period}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 border border-cyan-200 dark:border-cyan-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span className="font-bold text-cyan-900 dark:text-cyan-300">
                            {plan.credits_per_cycle} Credits
                          </span>
                        </div>
                        <p className="text-sm text-cyan-800 dark:text-cyan-400">
                          Every {plan.period}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isProcessing || !isAuthenticated}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
                      >
                        {isProcessing ? 'Processing...' : isAuthenticated ? 'Subscribe Now' : 'Sign In to Subscribe'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Coupon Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 p-6 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Have a coupon?</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCoupon}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-6"
                >
                  Apply
                </Button>
              </div>
              {appliedCoupon && (
                <p className="text-green-600 dark:text-green-400 text-sm font-medium mt-3">
                  ✓ Coupon "{appliedCoupon.code}" applied!
                </p>
              )}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && !isLoading && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">
                  Please sign in to view your subscriptions
                </p>
                <a href="/login" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                  Sign In
                </a>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
                <CreditCard className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  No Active Subscriptions
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Start a subscription to get recurring credits.
                </p>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  View Plans
                </button>
              </div>
            ) : (
              subscriptions.map(subscription => (
                <div
                  key={subscription._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                          <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Subscription #{subscription._id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Plan: {subscription.plan_id}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-200 dark:border-slate-800">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase mb-1">
                            Status
                          </p>
                          <div className={`inline-flex px-3 py-1.5 rounded-full font-bold text-sm border-2 capitalize ${getStatusColor(subscription.status)}`}>
                            {subscription.status}
                          </div>
                        </div>
                        {subscription.current_period_end && (
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase mb-1">
                              Renews On
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {new Date(subscription.current_period_end).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {subscription.status !== 'cancelled' && (
                        <>
                          {confirmCancel === subscription._id ? (
                            <div className="space-y-2 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Cancel?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCancelSubscription(subscription._id)}
                                  disabled={cancelingId === subscription._id}
                                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-sm"
                                >
                                  {cancelingId === subscription._id ? 'Canceling...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setConfirmCancel(null)}
                                  className="flex-1 px-3 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-lg transition-all text-sm"
                                >
                                  Back
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmCancel(subscription._id)}
                              className="px-4 py-2 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold transition-all"
                            >
                              Cancel
                            </button>
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
        {activeTab === 'one-time' && !isLoading && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Preset Packages */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
                  Choose a Package
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.credits}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setCustomCredits(null);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPackage?.credits === pkg.credits && !customCredits
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                      } relative group`}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                          Popular
                        </div>
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {pkg.credits}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {getConvertedAmount(pkg.amount)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {(pkg.amount / pkg.credits * 100).toFixed(1)}¢ per credit
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Or Enter Custom Amount
                </h2>
                <Input
                  type="number"
                  value={customCredits || ''}
                  onChange={handleCustomCredits}
                  placeholder="Enter credits"
                  min="1"
                  max="50000"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="sticky top-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6 space-y-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">
                    Order Summary
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-300">Credits</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {customCredits || selectedPackage?.credits || 0}
                      </span>
                    </div>
                    <div className="flex justify-between pb-3 border-b-2 border-purple-200 dark:border-purple-800">
                      <span className="text-slate-700 dark:text-slate-300">Amount</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {getConvertedAmount(customAmount || selectedPackage?.amount || 0)} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-slate-900 dark:text-slate-100">Total</span>
                      <span className="font-black text-purple-600 dark:text-purple-400">
                        {getConvertedAmount(customAmount || selectedPackage?.amount || 0)} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleOneTimePayment}
                  disabled={isProcessing || !isAuthenticated || (customCredits === null && selectedPackage?.credits === 0)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
                >
                  {isProcessing ? 'Processing...' : isAuthenticated ? 'Pay Now' : 'Sign In to Buy'}
                </Button>

                <p className="text-xs text-slate-600 dark:text-slate-400 text-center space-y-1">
                  <div>✓ Credits never expire</div>
                  <div>✓ No hidden charges</div>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT HISTORY TAB */}
        {activeTab === 'history' && !isLoading && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">
                  Please sign in to view payment history
                </p>
                <a href="/login" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                  Sign In
                </a>
              </div>
            ) : (
              <>
                {/* Stats */}
                {logs.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">
                            Total Spent
                          </p>
                          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                            ${totalSpent.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                          <CreditCard className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">
                            Total Credits
                          </p>
                          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                            {totalCredits}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                          <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transactions */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
                  {logs.length === 0 ? (
                    <div className="p-12 text-center">
                      <CreditCard className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        No Payment History
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        You haven't made any payments yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                              Date
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                              Credits
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log, idx) => (
                            <tr
                              key={log._id}
                              className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/50'
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                {new Date(log.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-bold">
                                {log.amount_paid.toFixed(2)} {log.currency}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-bold">
                                +{log.credits_added}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex px-3 py-1.5 rounded-full font-bold text-xs border-2 capitalize ${getStatusColor(log.status)}`}>
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

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
};
