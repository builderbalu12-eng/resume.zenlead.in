import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spinner } from "./Spinner";
import { GlowBorder } from "@/components/motion/GlowBorder";
import type { SubscriptionPlan } from "@/services/paymentService";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PlanCard({
  plan,
  billingCycle,
  isMostPopular,
  discountedAmount,
  discountLabel,
  onGetStarted,
  isLoading,
}: {
  plan: SubscriptionPlan;
  billingCycle: "monthly" | "yearly";
  isMostPopular: boolean;
  discountedAmount: number | null;
  discountLabel: string | null;
  onGetStarted: () => void;
  isLoading: boolean;
}) {
  const isFree = plan.amount === 0;
  const baseAmount = plan.amount;
  const finalAmount = discountedAmount ?? baseAmount;

  const card = (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={[
        "relative rounded-2xl bg-white shadow-lg dark:bg-slate-900 h-full",
        isMostPopular
          ? "border border-indigo-300/50 dark:border-indigo-700/50"
          : "border border-slate-200 dark:border-slate-800",
      ].join(" ")}
    >
      {isMostPopular && (
        <div className="absolute -top-3 left-5 z-20">
          <div className="rounded-full border border-indigo-300 bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            Most Popular
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {plan.plan_name}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {plan.description}
            </p>
          </div>
          {plan.is_recurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Recurring
            </span>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {formatINR(finalAmount)}
            </span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              / {billingCycle === "yearly" ? "year" : "month"}
            </span>
          </div>

          {plan.billing_cycle === "yearly" && (
            <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              Save 2 months
            </div>
          )}

          {discountLabel && (
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {discountLabel}
            </p>
          )}

          {discountedAmount !== null && (
            <p className="mt-1 text-sm text-slate-500 line-through dark:text-slate-500">
              {formatINR(baseAmount)}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {plan.credits_per_cycle} credits / cycle
          </p>
        </div>

        <ul className="mt-5 space-y-2">
          {(plan.points || []).map((p, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              onClick={onGetStarted}
              disabled={isFree || isLoading}
              className={[
                "h-11 w-full rounded-xl font-bold",
                isFree
                  ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white",
              ].join(" ")}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Processing…
                </>
              ) : isFree ? (
                "Current Plan"
              ) : (
                "Get Started"
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  if (isMostPopular) {
    return <GlowBorder active>{card}</GlowBorder>;
  }
  return card;
}
