import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Check, Zap, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, SubscriptionPlan } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'CAD'];

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSubscriptionPlans(0, 100, true);
        setPlans(response.data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      // TODO: Implement coupon verification
      setAppliedCoupon({ code: couponCode });
    } catch (err) {
      setError('Invalid coupon code');
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedPlan(planId);
    navigate(`/checkout?plan=${planId}&currency=${currency}`);
  };

  const handleOneTimePayment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/one-time-payment?currency=${currency}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl sm:text-6xl font-black font-heading">
            <span className="text-slate-900 dark:text-slate-100">Simple, </span>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Choose the perfect plan for your resume tailoring needs
          </p>
        </div>

        {/* Currency Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-4">Currency:</span>
            <div className="flex gap-1">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-4 py-2 rounded-md font-bold transition-all ${
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

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="group relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 dark:from-cyan-500/10 dark:to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative p-8 space-y-6">
                {/* Plan Header */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {plan.plan_name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
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
                    {plan.period === 'monthly' ? 'Per month' : 'Per ' + plan.period}
                  </p>
                </div>

                {/* Credits */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-cyan-900 dark:text-cyan-300">
                      {plan.credits_per_cycle} Credits
                    </span>
                  </div>
                  <p className="text-sm text-cyan-800 dark:text-cyan-400">
                    {plan.period === 'monthly' ? 'Every month' : 'Every ' + plan.period}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Includes:</p>
                  {[
                    'Unlimited resume tailoring',
                    'ATS score analysis',
                    'Priority support',
                    'Download all tailored versions',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <Button
                  onClick={() => handleSelectPlan(plan._id)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  {isAuthenticated ? 'Subscribe Now' : 'Sign In to Subscribe'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* One-Time Payment Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  One-Time Purchase
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                Need credits on demand? Purchase additional credits without a subscription commitment.
              </p>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  No commitment required
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Credits never expire
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Instant access
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Popular Package</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    {currency === 'INR' ? '499' : '6'}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">{currency}</span>
                </div>
                <div className="flex items-center gap-2 mb-6 p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-bold text-cyan-900 dark:text-cyan-300">150 Credits</span>
                </div>
                <Button
                  onClick={handleOneTimePayment}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition-all duration-200"
                >
                  {isAuthenticated ? 'Buy Now' : 'Sign In to Buy'}
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  );
};
