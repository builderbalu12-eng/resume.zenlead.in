import * as React from "react";
import { toast } from "sonner";

import { ActiveSubscription } from "@/components/payment/ActiveSubscription";
import { BillingTable } from "@/components/payment/BillingTable";
import { paymentService, type BillingHistoryItem, type SubscriptionItem } from "@/services/paymentService";

export function BillingPage() {
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
          Manage your subscription and view your billing history.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>
        </div>
      ) : (
        <>
          <ActiveSubscription subscription={active} onCancel={cancel} canceling={canceling} />

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Billing History
            </h2>
            <BillingTable items={history} />
          </div>
        </>
      )}
    </div>
  );
}

