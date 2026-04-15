import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { ActiveSubscription } from "@/components/payment/ActiveSubscription";
import { BillingTable } from "@/components/payment/BillingTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { paymentService, type BillingHistoryItem, type SubscriptionItem } from "@/services/paymentService";
import { apiClient, type CreditLogEntry } from "@/services/api";

export function BillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const creditsRef = React.useRef<HTMLElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [canceling, setCanceling] = React.useState(false);
  const [active, setActive] = React.useState<SubscriptionItem | null>(null);
  const [history, setHistory] = React.useState<BillingHistoryItem[]>([]);
  const [creditsHistory, setCreditsHistory] = React.useState<CreditLogEntry[]>([]);
  const [loadingCredits, setLoadingCredits] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, histRes] = await Promise.all([
        paymentService.getSubscriptions(),
        paymentService.getBillingHistory(),
      ]);

      const activeSub =
        (subsRes.data.items || []).find((s) => s.status === "active") ||
        (subsRes.data.items || [])[0] ||
        null;
      setActive(activeSub);
      setHistory(histRes.data.items || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load billing", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setLoadingCredits(true);
    apiClient.getCreditsHistory(0, 50)
      .then((res) => setCreditsHistory(res.items))
      .catch(() => {})
      .finally(() => setLoadingCredits(false));
  }, []);

  React.useEffect(() => {
    if (location.hash === "#credits" && creditsRef.current) {
      setTimeout(() => creditsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location.hash]);

  const cancel = async (id: string) => {
    try {
      setCanceling(true);
      await paymentService.cancelSubscription(id);
      toast.success("Subscription cancelled", { duration: 3000 });
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to cancel subscription", { duration: 5000 });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Billing
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your plan, view payments, and add more credits.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* SECTION 1 — Current Plan */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              💳 Current Plan
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              View your active subscription, renewal date, and manage cancellations.
            </p>
            <ActiveSubscription subscription={active} onCancel={cancel} canceling={canceling} />
          </section>

          {/* SECTION 2 — Payment History */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              🧾 Payment History
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              All your previous payments, amounts, credits, and statuses in one place.
            </p>
            <BillingTable items={history} />
          </section>

          {/* SECTION 3 — Credit Activity */}
          <section ref={creditsRef} id="credits" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              💳 Credit Activity
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Every credit deduction and top-up on your account.
            </p>
            {loadingCredits ? (
              <div className="space-y-2 py-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : creditsHistory.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No credit activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300">Feature</th>
                      <th className="text-center py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300">Credits</th>
                      <th className="text-center py-2 pr-4 font-semibold text-slate-600 dark:text-slate-300">Balance After</th>
                      <th className="text-right py-2 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditsHistory.map((entry, i) => {
                      const isDeduction = entry.type === "deduction";
                      const sign = isDeduction ? "−" : "+";
                      const color = isDeduction ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
                      return (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">
                            {entry.display_name || entry.feature}
                          </td>
                          <td className={cn("py-2.5 pr-4 text-center font-semibold tabular-nums", color)}>
                            {sign}{entry.amount} cr
                          </td>
                          <td className="py-2.5 pr-4 text-center text-slate-500 dark:text-slate-400 tabular-nums">
                            {entry.balance_after} cr
                          </td>
                          <td className="py-2.5 text-right text-xs text-slate-400 dark:text-slate-500">
                            {new Date(entry.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SECTION 4 — Add Credits */}
          <section className="mb-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              ➕ Add More Credits
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Need more credits for tailoring or lead finding? Visit the pricing page to top up.
            </p>
            <Button
              type="button"
              variant="gradient"
              className="h-10 px-5"
              onClick={() => navigate("/pricing")}
            >
              View Pricing Plans
            </Button>
          </section>
        </>
      )}
    </div>
  );
}

