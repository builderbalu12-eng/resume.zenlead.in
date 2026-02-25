import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Check, CreditCard, Gift, Loader, Settings, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, PaymentLog, SubscriptionPlan } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CREDIT_PACKAGES = [
  { credits: 100, amount: 999 },
  { credits: 250, amount: 1999, popular: true },
  { credits: 600, amount: 4499 },
  { credits: 1200, amount: 7999 },
];

type TabType = 'plans' | 'subscriptions' | 'one-time' | 'history';

const formatInr = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);


const withRedirectUrl = (checkoutUrl: string) => {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('redirect_url', `${window.location.origin}/payment/success?source=subscription`);
    return url.toString();
  } catch {
    return checkoutUrl;
  }
};

export const PricingHub: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [logs, setLogs] = useState<PaymentLog[]>([]);

  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]);
  const [customCredits, setCustomCredits] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [isOrderProcessing, setIsOrderProcessing] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        if (activeTab === 'plans') {
          const response = await apiClient.getSubscriptionPlans(0, 100, true);
          setPlans(response.data?.items || []);
        }

        if (activeTab === 'subscriptions' && isAuthenticated) {
          const response = await apiClient.getSubscriptions(0, 100);
          setSubscriptions(response.data?.items || []);
        }

        if (activeTab === 'history' && isAuthenticated) {
          const response = await apiClient.getPaymentLogs(0, 100);
          setLogs(response.data?.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pricing details');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, isAuthenticated]);

  const totals = useMemo(() => {
    const successful = logs.filter((log) => ['success', 'succeeded'].includes(log.status.toLowerCase()));
    return {
      totalSpent: successful.reduce((sum, log) => sum + log.amount_paid, 0),
      totalCredits: successful.reduce((sum, log) => sum + log.credits_added, 0),
    };
  }, [logs]);

  const handleCustomCredits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || null;
    setCustomCredits(value);
    if (value) {
      setCustomAmount(Math.round(value * 8));
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated || !user) {
      setError('Please sign in to subscribe');
      return;
    }

    if (subscribingPlanId) {
      return;
    }

    try {
      setError(null);
      setSubscribingPlanId(plan._id);

      let razorpayPlanId = plan.razorpay_plan_id;

      if (!razorpayPlanId) {
        const selectedPlan = await apiClient.getSubscriptionPlan(plan._id);
        razorpayPlanId = selectedPlan?.razorpay_plan_id;
      }

      if (!razorpayPlanId) {
        throw new Error('Selected plan is misconfigured. Please contact support.');
      }

      const response = await apiClient.createSubscription(razorpayPlanId, user._id);
      if (response.short_url) {
        window.location.href = withRedirectUrl(response.short_url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleOneTimePayment = async () => {
    if (!isAuthenticated || !user) {
      setError('Please sign in to purchase credits');
      return;
    }

    const pkg = customCredits ? { credits: customCredits, amount: customAmount || 0 } : selectedPackage;
    if (!pkg || pkg.credits <= 0) {
      setError('Please select a package');
      return;
    }

    try {
      setError(null);
      setIsOrderProcessing(true);
      const response = await apiClient.createPaymentOrder(pkg.amount, 'INR', pkg.credits, `credits_${user._id}_${Date.now()}`);

      if (response.data?.order_id) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          order_id: response.data.order_id,
          description: response.data.description,
          handler: async () => {
            setError(null);
            navigate('/payment/success?source=topup');
          },
          modal: {
            ondismiss: () => {
              setIsOrderProcessing(false);
            },
          },
          prefill: {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          },
          theme: { color: '#06B6D4' },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on('payment.failed', () => {
          setError('Payment failed. Please try again.');
          setIsOrderProcessing(false);
        });
        razorpay.open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setIsOrderProcessing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setCancelingId(subscriptionId);
      await apiClient.cancelSubscription(subscriptionId);
      setSubscriptions((subs) => subs.filter((s) => s._id !== subscriptionId));
      setConfirmCancel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white p-8 md:p-10 shadow-xl mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-3">Simple Pricing</p>
          <h1 className="text-4xl md:text-5xl font-black mb-3">Scale your resume workflow</h1>
          <p className="text-white/90 max-w-2xl">Transparent plans and rupee-only pricing.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="mb-7 flex flex-wrap gap-2">
          {[
            { id: 'plans' as TabType, label: 'Plans', icon: Sparkles },
            { id: 'subscriptions' as TabType, label: 'Subscriptions', icon: Settings },
            { id: 'one-time' as TabType, label: 'Buy Credits', icon: Gift },
            { id: 'history' as TabType, label: 'History', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="py-20 text-center">
            <Loader className="h-10 w-10 mx-auto animate-spin text-slate-500" />
          </div>
        )}

        {activeTab === 'plans' && !isLoading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{plan.plan_name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 min-h-12">{plan.description}</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-4">{formatInr(plan.amount)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Per {plan.period}</p>
                <p className="mt-4 text-sm font-semibold text-cyan-700 dark:text-cyan-300">{plan.credits_per_cycle} credits every cycle</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /> Optimized ATS scoring support</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /> Fast resume tailoring workflows</li>
                </ul>
                <Button
                  className="mt-6"
                  disabled={subscribingPlanId === plan._id || !isAuthenticated}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {subscribingPlanId === plan._id
                    ? 'Opening checkout...'
                    : isAuthenticated
                      ? 'Choose plan'
                      : 'Sign in to subscribe'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'subscriptions' && !isLoading && (
          <div className="space-y-4">
            {!isAuthenticated ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-600 dark:text-slate-400">Please sign in to view subscriptions.</div>
            ) : subscriptions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-600 dark:text-slate-400">No active subscriptions found.</div>
            ) : (
              subscriptions.map((subscription) => (
                <div key={subscription._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Subscription #{subscription._id.slice(-6)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1"><Calendar className="h-4 w-4" /> Status: {subscription.status}</p>
                  </div>
                  {confirmCancel === subscription._id ? (
                    <div className="flex gap-2">
                      <Button variant="destructive" disabled={cancelingId === subscription._id} onClick={() => handleCancelSubscription(subscription._id)}>
                        Confirm Cancel
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmCancel(null)}>Keep</Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => setConfirmCancel(subscription._id)}>Cancel Plan</Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'one-time' && !isLoading && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Choose credit package</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.credits}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setCustomCredits(null);
                      }}
                      className={`text-left rounded-xl border p-4 transition ${
                        selectedPackage.credits === pkg.credits && !customCredits
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                      }`}
                    >
                      <p className="font-bold text-slate-900 dark:text-white">{pkg.credits} credits</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatInr(pkg.amount)}</p>
                      {pkg.popular && <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mt-2">Most popular</p>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Custom credits</h2>
                <Input type="number" value={customCredits || ''} onChange={handleCustomCredits} min="1" placeholder="Enter credits" />
              </div>
            </div>

            <div>
              <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Order summary</p>
                <div className="flex justify-between text-sm"><span>Credits</span><span className="font-bold">{customCredits || selectedPackage.credits}</span></div>
                <div className="flex justify-between text-sm border-b border-slate-200 dark:border-slate-800 pb-3"><span>Amount</span><span className="font-bold">{formatInr(customAmount || selectedPackage.amount)}</span></div>
                <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-black">{formatInr(customAmount || selectedPackage.amount)}</span></div>
                <Button className="w-full" disabled={isOrderProcessing || !isAuthenticated} onClick={handleOneTimePayment}>{isOrderProcessing ? 'Processing...' : isAuthenticated ? 'Pay now' : 'Sign in to buy'}</Button>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>✓ Price displayed only in INR</p>
                  <p>✓ No hidden charges</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && !isLoading && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-600 dark:text-slate-400">Please sign in to view payment history.</div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Spent</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatInr(totals.totalSpent)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Credits Purchased</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">{totals.totalCredits} <TrendingUp className="h-5 w-5 text-cyan-600" /></p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                  <table className="w-full min-w-[620px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs uppercase text-slate-600 dark:text-slate-400">Date</th>
                        <th className="px-6 py-4 text-right text-xs uppercase text-slate-600 dark:text-slate-400">Amount (INR)</th>
                        <th className="px-6 py-4 text-right text-xs uppercase text-slate-600 dark:text-slate-400">Credits</th>
                        <th className="px-6 py-4 text-center text-xs uppercase text-slate-600 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{new Date(log.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900 dark:text-white">{formatInr(log.amount_paid)}</td>
                          <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">+{log.credits_added}</td>
                          <td className="px-6 py-4 text-center"><span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs uppercase text-slate-700 dark:text-slate-300">{log.status}</span></td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={4}>No payment history yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
};
