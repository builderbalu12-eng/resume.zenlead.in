import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CreditCard, Loader2, PencilLine, ReceiptText, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, PaymentLog, SubscriptionPlan, User } from '@/services/api';
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
  const { user: authUser, isAuthenticated, updateCurrentUser } = useAuth();
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

  // Personal Info
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Telegram
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramExpanded, setTelegramExpanded] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pollingTelegram, setPollingTelegram] = useState(false);

  // Load user profile on account tab or on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (activeTab === 'account') {
        try {
          setIsLoading(true);
          const response = await apiClient.getCurrentUser();
          setUser(response);
          setFirstName(response.firstName);
          setLastName(response.lastName);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserProfile();
  }, [activeTab]);

  // Load telegram status when account tab is active
  useEffect(() => {
    const loadTelegramStatus = async () => {
      if (activeTab === 'account') {
        try {
          setTelegramLoading(true);
          const status = await apiClient.getTelegramStatus();
          setTelegramLinked(status.linked);
        } catch (err) {
          console.log('Failed to load telegram status');
        } finally {
          setTelegramLoading(false);
        }
      }
    };

    loadTelegramStatus();
  }, [activeTab]);

  // Cleanup blob URL when component unmounts or expanded state changes
  useEffect(() => {
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [qrImageUrl]);

  // Polling for telegram connection
  useEffect(() => {
    if (!pollingTelegram || !telegramExpanded) return;

    const interval = setInterval(async () => {
      try {
        const status = await apiClient.getTelegramStatus();
        if (status.linked) {
          setTelegramLinked(true);
          setPollingTelegram(false);
          setTelegramExpanded(false);
          setTelegramMessage({ type: 'success', text: 'Telegram connected successfully!' });
          setTimeout(() => setTelegramMessage(null), 3000);
        }
      } catch (err) {
        // Keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pollingTelegram, telegramExpanded]);

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

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.updateCurrentUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      const updatedUser = {
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      setUser(updatedUser);
      updateCurrentUser(updatedUser);

      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordMessage(null);

      await apiClient.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update password';
      if (errorMsg.includes('401') || errorMsg.includes('Current password')) {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
      } else {
        setPasswordMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleConnectTelegram = async () => {
    try {
      setTelegramLoading(true);
      setTelegramMessage(null);

      // Fetch QR code
      const blob = await apiClient.getTelegramQR();
      const url = URL.createObjectURL(blob);
      setQrImageUrl(url);

      // Fetch link
      const linkResponse = await apiClient.getTelegramLink();
      setTelegramLink(linkResponse.link);

      setTelegramExpanded(true);
      setPollingTelegram(true);
    } catch (err) {
      setTelegramMessage({ type: 'error', text: 'Failed to load Telegram connection' });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect Telegram?\nYou will stop receiving notifications.'
    );

    if (!confirmed) return;

    try {
      setTelegramLoading(true);
      await apiClient.disconnectTelegram();
      setTelegramLinked(false);
      setTelegramMessage({ type: 'success', text: 'Telegram disconnected successfully' });
      setTimeout(() => setTelegramMessage(null), 3000);
    } catch (err) {
      setTelegramMessage({ type: 'error', text: 'Failed to disconnect Telegram' });
    } finally {
      setTelegramLoading(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', icon: PencilLine },
    { id: 'plans', label: 'Plans', icon: Sparkles },
    { id: 'subscriptions', label: 'Subscriptions', icon: CalendarClock },
    { id: 'history', label: 'Payment History', icon: ReceiptText },
  ];

  if (!isAuthenticated || !authUser) {
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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{authUser.firstName} {authUser.lastName}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{authUser.email}</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-3">Available credits: {authUser.credits}</p>
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

        {isLoading && activeTab === 'account' ? (
          <div className="py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-500" />
          </div>
        ) : (
          <>
            {activeTab === 'account' && user && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">First name</p>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Last name</p>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Email</p>
                    <Input value={user.email} disabled className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>

                {/* Change Password - only for local auth */}
                {user.auth_provider === 'local' && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-800"></div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Change Password</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Leave blank if you don't want to change</p>

                      <div className="space-y-4 mb-4">
                        {/* Current Password */}
                        <div>
                          <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Current Password</p>
                          <div className="relative">
                            <Input
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">New Password</p>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Confirm Password</p>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {passwordMessage && (
                        <p
                          className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
                            passwordMessage.type === 'success'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {passwordMessage.text}
                        </p>
                      )}

                      <Button
                        onClick={handleChangePassword}
                        disabled={isUpdatingPassword}
                        variant="outline"
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </>
                )}

                {/* Telegram Notifications */}
                <>
                  <div className="border-t border-slate-200 dark:border-slate-800"></div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Telegram Notifications 🤖</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Receive job alerts and resume files on Telegram</p>

                    {telegramLinked ? (
                      <>
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                          <p className="text-green-700 font-medium">✅ Telegram Connected</p>
                          <p className="text-sm text-green-600 mt-1">You will receive job alerts and resume files here</p>
                        </div>
                        <Button
                          onClick={handleDisconnectTelegram}
                          disabled={telegramLoading}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          {telegramLoading ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 mb-4 text-sm text-slate-700 dark:text-slate-300">
                          <p className="font-medium mb-2">Connect Telegram to receive:</p>
                          <p>🎯 Job match alerts instantly</p>
                          <p>📄 Tailored resume PDF files</p>
                          <p>🔔 Application update notifications</p>
                        </div>

                        {!telegramExpanded ? (
                          <Button
                            onClick={handleConnectTelegram}
                            disabled={telegramLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {telegramLoading ? 'Loading...' : 'Connect Telegram'}
                          </Button>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Scan QR or click the link</h4>

                            {qrImageUrl && (
                              <div className="flex flex-col items-center mb-6">
                                <img
                                  src={qrImageUrl}
                                  alt="Telegram QR Code"
                                  width="180"
                                  height="180"
                                  className="rounded-xl border-2 border-slate-300 dark:border-slate-600"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-3 my-4">
                              <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
                              <span className="text-sm text-slate-500 dark:text-slate-400">OR</span>
                              <div className="flex-1 border-t border-slate-300 dark:border-slate-600"></div>
                            </div>

                            {telegramLink && (
                              <Button
                                onClick={() => window.open(telegramLink, '_blank')}
                                variant="outline"
                                className="w-full mb-4"
                              >
                                Open Telegram →
                              </Button>
                            )}

                            <p className="text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                              1. Scan QR or tap Open Telegram<br />
                              2. Press START in the Telegram bot<br />
                              3. This page will update automatically
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {telegramMessage && (
                      <p
                        className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
                          telegramMessage.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {telegramMessage.text}
                      </p>
                    )}
                  </div>
                </>
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
