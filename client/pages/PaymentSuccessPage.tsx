import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import { useAuth } from "@/contexts/AuthContext";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { updateCurrentUser } = useAuth();
  const [planName, setPlanName] = React.useState<string | null>(null);

  const hasRunRef = React.useRef(false);

  React.useEffect(() => {
    setPlanName(params.get("plan"));
    const orderId = params.get("order_id");

    if (!hasRunRef.current) {
      hasRunRef.current = true;

      const run = async () => {
        // Verify with Cashfree if order_id present (webhook also fires, this is belt-and-suspenders)
        if (orderId) {
          try {
            await paymentService.verifyPayment({ cashfree_order_id: orderId });
          } catch {
            // Webhook likely already processed it — ignore verify errors on success page
          }
        }

        // Refresh user to get updated plan + credits
        try {
          const me = await paymentService.refreshMe();
          const nextUser = me?.data?.user || me?.data || me;
          if (nextUser && typeof nextUser === "object") updateCurrentUser(nextUser);
        } catch (e: any) {
          toast.error(e?.message || "Could not refresh account. Please reload.", { duration: 5000 });
        }
      };

      run();
    }

    const t = window.setTimeout(() => navigate("/billing"), 4000);
    return () => window.clearTimeout(t);
  }, [navigate, params, updateCurrentUser]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
          Payment Successful!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your plan is now active.
        </p>
        {planName && (
          <p className="mt-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            Plan: {planName}
          </p>
        )}

        <div className="mt-6">
          <Button
            type="button"
            onClick={() => navigate("/billing")}
            className="h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
          >
            Go to Billing
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
          Redirecting to billing in 4 seconds…
        </p>
      </div>
    </div>
  );
}

