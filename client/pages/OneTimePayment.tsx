import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Zap, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCashfree } from '@/hooks/useCashfree';
import { CashfreePaymentModal } from '@/components/CashfreePaymentModal';

interface CreditPackage {
  credits: number;
  amount: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 50, amount: 2 },
  { credits: 150, amount: 6, popular: true },
  { credits: 500, amount: 19 },
  { credits: 1000, amount: 35 },
];

export const OneTimePayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { openCheckout } = useCashfree();

  const currency = searchParams.get('currency') || 'USD';

  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(CREDIT_PACKAGES[1]);
  const [customCredits, setCustomCredits] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const finalPackage = customCredits
    ? { credits: customCredits, amount: customAmount || 0 }
    : selectedPackage;

  const getConvertedAmount = (amount: number): string => {
    if (currency === 'USD') return amount.toFixed(2);
    if (currency === 'INR') return (amount * 83).toFixed(0);
    if (currency === 'EUR') return (amount * 0.92).toFixed(2);
    if (currency === 'GBP') return (amount * 0.79).toFixed(2);
    if (currency === 'CAD') return (amount * 1.36).toFixed(2);
    return amount.toFixed(2);
  };

  const handleCustomCredits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || null;
    setCustomCredits(value);
    if (value) {
      // Simple pricing: ~$0.04 per credit for base prices
      const baseAmount = (value / 50) * 2;
      setCustomAmount(baseAmount);
    }
  };

  const handlePayment = async () => {
    if (!finalPackage || !user) {
      setError('Invalid payment data');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create payment order with user_id
      const response = await apiClient.createPaymentOrder(
        finalPackage.amount,
        currency,
        finalPackage.credits,
        `credits_${user._id}_${Date.now()}`,
        user._id
      );

      if (!response.data || !response.data.payment_session_id) {
        throw new Error('Failed to create payment order');
      }

      // Open modal then launch Cashfree inline inside it
      setModalOpen(true);
      await new Promise((r) => setTimeout(r, 50));

      await openCheckout({
        paymentSessionId: response.data.payment_session_id,
        onFailure: (reason) => {
          setModalOpen(false);
          setError(reason);
          setIsProcessing(false);
        },
        onModalClose: () => setModalOpen(false),
      });
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  return (
    <>
    <CashfreePaymentModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      planName={finalPackage ? `${finalPackage.credits} Credits` : null}
    />
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

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Buy Credits
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Purchase credits and use them whenever you want
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Package Selection */}
          <div className="md:col-span-2 space-y-6">
            {/* Preset Packages */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
                Choose a Package
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.credits}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setCustomCredits(null);
                      setCustomAmount(null);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPackage?.credits === pkg.credits && !customCredits
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700'
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Number of Credits
                  </label>
                  <Input
                    type="number"
                    value={customCredits || ''}
                    onChange={handleCustomCredits}
                    placeholder="Enter credits"
                    min="1"
                    max="50000"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Minimum 50 credits
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}
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
                      {finalPackage?.credits || 0}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3 border-b-2 border-purple-200 dark:border-purple-800">
                    <span className="text-slate-700 dark:text-slate-300">Amount</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {getConvertedAmount(finalPackage?.amount || 0)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Total</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">
                      {getConvertedAmount(finalPackage?.amount || 0)} {currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  {finalPackage && finalPackage.credits > 0
                    ? `${(finalPackage.amount / finalPackage.credits * 100).toFixed(2)}¢ per credit`
                    : 'Select credits'}
                </p>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing || !finalPackage || finalPackage.credits === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>

              {/* Info */}
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center space-y-1">
                <div>✓ Credits never expire</div>
                <div>✓ No hidden charges</div>
                <div>✓ Secure payment</div>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
};
