import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ActiveSubscription } from "@/components/payment/ActiveSubscription";
import { BillingTable } from "@/components/payment/BillingTable";
import { Button } from "@/components/ui/button";
import { paymentService, type BillingHistoryItem, type SubscriptionItem } from "@/services/paymentService";

export function BillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [canceling, setCanceling] = React.useState(false);
  const [active, setActive] = React.useState<SubscriptionItem | null>(null);
  const [history, setHistory] = React.useState<BillingHistoryItem[]>([]);

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
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>
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

          {/* SECTION 3 — Add Credits */}
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

