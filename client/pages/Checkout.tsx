import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Check, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, SubscriptionPlan } from '@/services/api';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const withRedirectUrl = (checkoutUrl: string) => {
  try {
    const url = new URL(checkoutUrl);
    const successUrl = `${window.location.origin}/payment/success?source=subscription`;
    url.searchParams.set('redirect_url', successUrl);
    console.log('Redirect URL set to:', successUrl);
    return url.toString();
  } catch (error) {
    console.error('Error setting redirect URL:', error);
    return checkoutUrl;
  }
};

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

      // Create subscription via backend - use plan._id (MongoDB ID), not razorpay_plan_id
      const response = await apiClient.createSubscription(plan._id, user?._id);

      if (!response.short_url) {
        throw new Error('Failed to generate payment link');
      }

      // Redirect to Razorpay checkout
      window.location.href = withRedirectUrl(response.short_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center">
          <p className="text-red-600 dark:text-red-400 font-bold mb-6">Plan not found</p>
          <Button
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
          >
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-bold mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Pricing
        </button>

        {/* Checkout Container */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
                Confirm Subscription
              </h1>

              {/* Plan Details */}
              <div className="space-y-6 pb-8 border-b-2 border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {plan.plan_name}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </p>
                </div>

                {/* What You Get */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">
                    What You Get
                  </p>
                  <div className="space-y-2">
                    {[
                      `${plan.credits_per_cycle} credits every ${plan.period}`,
                      'Unlimited resume tailoring',
                      'ATS score analysis',
                      'Priority support',
                      'Download all versions',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="py-8 space-y-4 border-b-2 border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">
                  Account
                </p>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Email</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{user?.email}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary Card */}
          <div className="md:col-span-1">
            <div className="sticky top-20 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 p-6 space-y-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">
                  Price
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                    {plan.amount}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-bold">
                    {currency}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Every {plan.period}
                </p>
              </div>

              {/* Credits Summary */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-bold text-cyan-900 dark:text-cyan-300">
                    {plan.credits_per_cycle} Credits
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Delivered every {plan.period}
                </p>
              </div>

              {/* Auto-Renewal Notice */}
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <p className="font-semibold">Subscription Details:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Automatically renews every {plan.period}</li>
                  <li>Cancel anytime from your account</li>
                  <li>No hidden charges</li>
                </ul>
              </div>

              {/* Subscribe Button */}
              <Button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </Button>

              {/* Terms */}
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                By subscribing, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
