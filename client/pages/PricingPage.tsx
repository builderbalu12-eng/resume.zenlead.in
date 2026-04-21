import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { CouponInput } from "@/components/payment/CouponInput";
import { PlanCard } from "@/components/payment/PlanCard";
import { paymentService, type BillingCycle, type SubscriptionPlan } from "@/services/paymentService";
import { useCashfree } from "@/hooks/useCashfree";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurFade, StaggerParent, FadeInItem } from "@/components/motion";

type CouponState =
  | { status: "idle" }
  | { status: "applying" }
  | { status: "applied"; code: string; planId: string; original: number; discounted: number; discount: number }
  | { status: "error"; message: string };

export function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateCurrentUser } = useAuth();
  const { openCheckout } = useCashfree();

  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(true);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");
  const [couponCode, setCouponCode] = React.useState("");
  const [coupon, setCoupon] = React.useState<CouponState>({ status: "idle" });
  const [processingPlanId, setProcessingPlanId] = React.useState<string | null>(null);
  const [showCoupon, setShowCoupon] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoadingPlans(true);
    paymentService
      .getPlans()
      .then((res) => {
        if (!active) return;
        setPlans(res.data.items || []);
      })
      .catch((e: any) => {
        toast.error(e?.message || "Failed to load plans", { duration: 5000 });
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Show only plans matching the current billing cycle toggle; Free (amount=0) always shows
  const visiblePlans = React.useMemo(
    () => plans.filter((p) => p.amount === 0 || p.billing_cycle === billingCycle),
    [plans, billingCycle]
  );

  const mostPopularId = React.useMemo(() => {
    const paid = visiblePlans.filter((p) => p.amount > 0).sort((a, b) => a.amount - b.amount);
    // Mark the second-most-expensive paid plan as Most Popular (Pro slot)
    return paid.length >= 2 ? paid[paid.length - 2]._id : paid[paid.length - 1]?._id ?? null;
  }, [visiblePlans]);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    // apply coupon against the most expensive plan to give the user strongest discount signal
    const targetPlanId = mostPopularId || plans[0]?._id;
    if (!targetPlanId) return;

    try {
      if (!isAuthenticated) {
        navigate(`/login?redirect=${encodeURIComponent("/pricing")}`);
        return;
      }

      setCoupon({ status: "applying" });
      const res = await paymentService.validateCoupon(code, targetPlanId);
      setCoupon({
        status: "applied",
        code: res.data.code,
        planId: targetPlanId,
        original: res.data.original_amount,
        discounted: res.data.discounted_amount,
        discount: res.data.discount,
      });
      toast.success(`Coupon ${res.data.code} applied`, { duration: 3000 });
    } catch (e: any) {
      setCoupon({ status: "error", message: e?.message || "Invalid coupon code" });
      toast.error(e?.message || "Invalid coupon code", { duration: 5000 });
    }
  };

  const getDiscountedAmountForPlan = (plan: SubscriptionPlan): { amount: number | null; label: string | null } => {
    if (coupon.status !== "applied") return { amount: null, label: null };
    if (coupon.planId !== plan._id) return { amount: null, label: null };

    const base = billingCycle === "yearly" ? plan.amount * 10 : plan.amount;
    const ratio = coupon.original > 0 ? coupon.discounted / coupon.original : 1;
    const discounted = Math.max(0, Math.round(base * ratio));
    const label = `Discount applied: -${Math.round((coupon.discount / coupon.original) * 100)}%`;
    return { amount: discounted, label };
  };

  const startPayment = async (plan: SubscriptionPlan) => {
    try {
      if (!isAuthenticated) {
        navigate(`/login?redirect=${encodeURIComponent("/pricing")}`);
        return;
      }

      setProcessingPlanId(plan._id);

      const coupon_code = coupon.status === "applied" ? coupon.code : undefined;

      // All plans (recurring + one-time) use Cashfree order → checkout flow
      let sessionId: string;
      let cashfreeOrderId: string;

      if (plan.is_recurring) {
        const res = await paymentService.createSubscription({
          plan_id: plan._id,
          billing_cycle: billingCycle,
          is_recurring: true,
          coupon_code,
        });
        // Free plan activated immediately
        if (!res.data.payment_session_id) {
          toast.success("Plan activated!", { duration: 3000 });
          navigate(`/payment/success?plan=${encodeURIComponent(plan.plan_name)}`);
          return;
        }
        sessionId = res.data.payment_session_id;
        cashfreeOrderId = res.data.cashfree_order_id;
      } else {
        const orderRes = await paymentService.createOrder({
          plan_id: plan._id,
          billing_cycle: billingCycle,
          is_recurring: false,
          coupon_code,
        });
        sessionId = orderRes.data.payment_session_id;
        cashfreeOrderId = orderRes.data.cashfree_order_id;
      }

      // Open Cashfree checkout — redirects to /payment/success?order_id=... on success
      await openCheckout({
        paymentSessionId: sessionId,
        onFailure: (reason) => toast.error(reason, { duration: 5000 }),
      });
    } catch (e: any) {
      toast.error(e?.message || "Payment failed", { duration: 5000 });
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <BlurFade className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Pricing
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Choose a plan that matches your ResumeMatch workflow.
        </p>
      </BlurFade>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={[
              "rounded-xl px-4 py-2 text-sm font-bold transition-colors",
              billingCycle === "monthly"
                ? "bg-indigo-500 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={[
              "rounded-xl px-4 py-2 text-sm font-bold transition-colors",
              billingCycle === "yearly"
                ? "bg-indigo-500 text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            Yearly
          </button>
        </div>

      </div>

      {loadingPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <div className="space-y-2 pt-2">
                {Array(5).fill(0).map((_, j) => <Skeleton key={j} className="h-3 w-full" />)}
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <StaggerParent className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const isMostPopular = plan._id === mostPopularId;
              const { amount, label } = getDiscountedAmountForPlan(plan);
              return (
                <FadeInItem key={plan._id}>
                  <PlanCard
                    plan={plan}
                    billingCycle={billingCycle}
                    isMostPopular={!!isMostPopular}
                    discountedAmount={amount}
                    discountLabel={label}
                    onGetStarted={() => startPayment(plan)}
                    isLoading={processingPlanId === plan._id}
                  />
                </FadeInItem>
              );
            })}
          </StaggerParent>

          <div className="mt-6 max-w-xl">
            <button
              type="button"
              onClick={() => setShowCoupon((prev) => !prev)}
              className="text-sm text-muted-foreground underline underline-offset-2"
            >
              Have a coupon code? Click here
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                showCoupon ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {showCoupon && (
                <CouponInput
                  value={couponCode}
                  onChange={(v) => {
                    setCouponCode(v);
                    if (coupon.status === "error") setCoupon({ status: "idle" });
                  }}
                  onApply={applyCoupon}
                  isApplying={coupon.status === "applying"}
                  error={coupon.status === "error" ? coupon.message : null}
                  appliedLabel={coupon.status === "applied" ? `✓ ${coupon.code} applied` : null}
                />
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          After payment success, you’ll be redirected to your dashboard automatically.
        </p>
        <p className="mt-1 text-sm text-indigo-800/80 dark:text-indigo-300/80">
          Payments are processed securely by Cashfree. You'll be redirected to complete payment.
        </p>
      </div>
    </div>
  );
}

