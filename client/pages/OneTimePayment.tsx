import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Zap, Gift, ShieldCheck, CreditCard, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreditPackage {
  credits: number;
  amount: number;
  popular?: boolean;
  desc?: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 50, amount: 2, desc: "Starter pack for quick fixes" },
  { credits: 150, amount: 6, popular: true, desc: "Most popular for active seekers" },
  { credits: 500, amount: 19, desc: "Power user pack for bulk applications" },
  { credits: 1000, amount: 35, desc: "Corporate level credit supply" },
];

export const OneTimePayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const currency = searchParams.get('currency') || 'USD';

  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(CREDIT_PACKAGES[1]);
  const [customCredits, setCustomCredits] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Create payment order
      const response = await apiClient.createPaymentOrder(
        finalPackage.amount,
        currency,
        finalPackage.credits,
        `credits_${user._id}_${Date.now()}`
      );

      if (!response.data || !response.data.order_id) {
        throw new Error('Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: response.data.key,
        amount: response.data.amount,
        currency: response.data.currency,
        order_id: response.data.order_id,
        description: response.data.description,
        handler: async (razorpayResponse: any) => {
          try {
            // Verify payment
            await apiClient.verifyPayment(
              razorpayResponse.razorpay_payment_id,
              razorpayResponse.razorpay_order_id,
              razorpayResponse.razorpay_signature
            );

            // Success - redirect to dashboard
            navigate('/', { state: { paymentSuccess: true } });
          } catch (err) {
            setError('Payment verification failed');
            setIsProcessing(false);
          }
        },
        prefill: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        theme: {
          color: '#06B6D4',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Header */}
      <div className="bg-slate-900 pt-32 pb-48 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Gift className="h-4 w-4" />
            Flexible Power Ups
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Buy <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Credits</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Fuel your resume tailoring with on-demand credits. No strings attached.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-20">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pricing')}
          className="group inline-flex items-center gap-2 text-white/70 hover:text-white font-black mb-12 transition-all"
        >
          <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm uppercase tracking-widest">Back to Hub</span>
        </button>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Selection Area */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-10 md:p-12">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Zap className="h-6 w-6 text-purple-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Choose Volume
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.credits}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setCustomCredits(null);
                      setCustomAmount(null);
                    }}
                    className={cn(
                      "relative group p-8 rounded-[2rem] border-2 text-left transition-all duration-300",
                      selectedPackage?.credits === pkg.credits && !customCredits
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-xl shadow-purple-200 dark:shadow-none"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/30"
                    )}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg z-10">
                        Popular Refill
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{pkg.credits}</span>
                        <div className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedPackage?.credits === pkg.credits && !customCredits 
                            ? "border-purple-500 bg-purple-500 shadow-lg" 
                            : "border-slate-200 bg-white"
                        )}>
                          {selectedPackage?.credits === pkg.credits && !customCredits && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">
                          {getConvertedAmount(pkg.amount)} <span className="text-sm font-bold text-slate-400">{currency}</span>
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider leading-tight">{pkg.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="space-y-6 pt-10 border-t-2 border-slate-50 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Need more?</h3>
                <div className="relative group">
                  <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                  <Input
                    type="number"
                    value={customCredits || ''}
                    onChange={handleCustomCredits}
                    placeholder="Enter custom credit amount"
                    className="w-full py-8 pl-16 pr-8 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 focus:border-purple-500 font-black text-xl transition-all"
                    min="1"
                    max="50000"
                  />
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Secure", desc: "Encrypted" },
                { icon: CreditCard, title: "Fast", desc: "Instant Add" },
                { icon: TrendingUp, title: "Value", desc: "No Expiry" }
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{item.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-12 bg-slate-900 dark:bg-white rounded-[2.5rem] shadow-2xl p-10 text-white dark:text-slate-900 space-y-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Purchase Details</p>
                <h3 className="text-3xl font-black tracking-tight">Order Summary</h3>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Credits Volume</span>
                  <span className="text-2xl font-black">{finalPackage?.credits || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-8 border-b border-slate-800 dark:border-slate-200">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cost Per Credit</span>
                  <span className="text-lg font-black tracking-tight">
                    {finalPackage && finalPackage.credits > 0
                      ? `${(finalPackage.amount / finalPackage.credits * 100).toFixed(1)}¢`
                      : '0¢'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Amount</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-purple-400 dark:text-purple-600">
                        {getConvertedAmount(finalPackage?.amount || 0)}
                      </span>
                      <span className="font-bold text-slate-400 uppercase">{currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !finalPackage || finalPackage.credits === 0}
                  className="w-full py-9 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xl shadow-2xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader className="h-6 w-6 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Refill Now</span>
                      <Zap className="h-5 w-5" />
                    </div>
                  )}
                </Button>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <p className="text-rose-400 text-[10px] font-black uppercase text-center">{error}</p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                      Credits are added to your balance immediately after payment verification.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                      No monthly fees. No expiration. No hidden costs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
};
