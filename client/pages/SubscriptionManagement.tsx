import React, { useState, useEffect } from 'react';
import { Loader, CreditCard, Zap, Calendar, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Subscription } from '@/services/api';
import { Button } from '@/components/ui/button';

export const SubscriptionManagement: React.FC = () => {
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
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Loader className="h-12 w-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading subscriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            My Subscriptions
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your active subscriptions and billing
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="space-y-6">
          {subscriptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
              <CreditCard className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                No Active Subscriptions
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You don't have any active subscriptions. Start one to get recurring credits.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
              >
                <Zap className="h-5 w-5" />
                View Pricing Plans
              </a>
            </div>
          ) : (
            subscriptions.map(subscription => (
              <div
                key={subscription._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Subscription Info */}
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
                          Plan ID: {subscription.plan_id}
                        </p>
                      </div>
                    </div>

                    {/* Status and Details */}
                    <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase mb-1">
                          Status
                        </p>
                        <div className={`inline-flex px-3 py-1.5 rounded-full font-bold text-sm border-2 capitalize ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </div>
                      </div>

                      {subscription.current_period_start && (
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase mb-1">
                            Period Start
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {new Date(subscription.current_period_start).toLocaleDateString()}
                          </p>
                        </div>
                      )}

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

                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>Started {new Date(subscription.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {subscription.status !== 'cancelled' && (
                      <>
                        {confirmCancel === subscription._id ? (
                          <div className="space-y-2 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              Cancel subscription?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancelSubscription(subscription._id)}
                                disabled={cancelingId === subscription._id}
                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-sm"
                              >
                                {cancelingId === subscription._id ? (
                                  <>
                                    <Loader className="h-4 w-4 animate-spin mr-2 inline" />
                                    Canceling...
                                  </>
                                ) : (
                                  'Confirm'
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmCancel(null)}
                                className="flex-1 px-3 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-bold rounded-lg transition-all text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancel(subscription._id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold transition-all"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        )}
                      </>
                    )}

                    {subscription.status === 'cancelled' && (
                      <a
                        href="/pricing"
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all text-center"
                      >
                        Resubscribe
                      </a>
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
