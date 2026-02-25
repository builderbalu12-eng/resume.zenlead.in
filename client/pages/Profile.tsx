import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CreditCard, Loader2, PencilLine, ReceiptText, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, PaymentLog, SubscriptionPlan } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ProfileTab = 'account' | 'plans' | 'subscriptions' | 'history';

const formatRupees = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const Profile: React.FC = () => {
  const { user, isAuthenticated, updateCurrentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = useMemo<ProfileTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'plans' || tab === 'subscriptions' || tab === 'history' || tab === 'account') {
      return tab;
    }
    return 'account';
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [logs, setLogs] = useState<PaymentLog[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (activeTab === 'plans') {
          const response = await apiClient.getSubscriptionPlans(0, 100, true);
          setPlans(response.data?.items || []);
          return;
        }

        if (!isAuthenticated) {
          setIsLoading(false);
          return;
        }

        if (activeTab === 'subscriptions') {
          const response = await apiClient.getSubscriptions(0, 100);
          setSubscriptions(response.data?.items || []);
        }

        if (activeTab === 'history') {
          const response = await apiClient.getPaymentLogs(0, 100);
          setLogs(response.data?.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, isAuthenticated]);

  const stats = useMemo(() => {
    const successful = logs.filter((log) => ['success', 'succeeded'].includes(log.status.toLowerCase()));
    const totalSpent = successful.reduce((sum, item) => sum + item.amount_paid, 0);
    const totalCredits = successful.reduce((sum, item) => sum + item.credits_added, 0);

    return { totalSpent, totalCredits };
  }, [logs]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.updateUser(user._id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (response?.data) {
        updateCurrentUser(response.data);
      } else {
        updateCurrentUser({ ...user, firstName: firstName.trim(), lastName: lastName.trim() });
      }

      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', icon: PencilLine },
    { id: 'plans', label: 'Plans', icon: Sparkles },
    { id: 'subscriptions', label: 'Subscriptions', icon: CalendarClock },
    { id: 'history', label: 'Payment History', icon: ReceiptText },
  ];

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Profile</h1>
        <p className="text-slate-600 dark:text-slate-400">Please sign in to view your profile and billing details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 mb-1">Your workspace</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{user.firstName} {user.lastName}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{user.email}</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-3">Available credits: {user.credits}</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && <p className="rounded-xl bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm font-medium">{error}</p>}
        {success && <p className="rounded-xl bg-green-50 text-green-700 border border-green-200 px-4 py-3 text-sm font-medium">{success}</p>}

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-500" />
          </div>
        ) : (
          <>
            {activeTab === 'account' && (
              <div className="grid md:grid-cols-2 gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div>
                  <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">First name</p>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Last name</p>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Email</p>
                  <Input value={user.email} disabled />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {plans.map((plan) => (
                  <div key={plan._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.plan_name}</h3>
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 min-h-12">{plan.description}</p>
                    <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{formatRupees(plan.amount)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Per {plan.period}</p>
                    <p className="text-sm font-semibold mt-3 text-cyan-700 dark:text-cyan-300">{plan.credits_per_cycle} credits / cycle</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-600 dark:text-slate-400">
                    No active subscriptions.
                  </div>
                ) : (
                  subscriptions.map((subscription) => (
                    <div key={subscription._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Subscription #{subscription._id.slice(-6)}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Status: {subscription.status}</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {subscription.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Spent</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatRupees(stats.totalSpent)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Credits Purchased</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalCredits}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="text-left p-4 text-xs uppercase text-slate-600 dark:text-slate-400">Date</th>
                        <th className="text-left p-4 text-xs uppercase text-slate-600 dark:text-slate-400">Amount</th>
                        <th className="text-left p-4 text-xs uppercase text-slate-600 dark:text-slate-400">Credits</th>
                        <th className="text-left p-4 text-xs uppercase text-slate-600 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{new Date(log.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white">{formatRupees(log.amount_paid)}</td>
                          <td className="p-4 text-sm text-slate-700 dark:text-slate-300">+{log.credits_added}</td>
                          <td className="p-4"><span className="text-xs uppercase rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-300">{log.status}</span></td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No payment history available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
