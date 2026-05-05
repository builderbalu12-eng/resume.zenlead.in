import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import { useAuth } from "@/contexts/AuthContext";

type State = "verifying" | "success" | "failed";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { updateCurrentUser } = useAuth();
  const [state, setState] = React.useState<State>("verifying");
  const [planName, setPlanName] = React.useState<string | null>(null);
  const hasRunRef = React.useRef(false);

  React.useEffect(() => {
    setPlanName(params.get("plan"));
    const orderId = params.get("order_id");

    if (!hasRunRef.current) {
      hasRunRef.current = true;

      const run = async () => {
        // If no order_id in URL (e.g. free plan activated by backend directly)
        if (!orderId) {
          setState("success");
          return;
        }

        try {
          await paymentService.verifyPayment({ cashfree_order_id: orderId });
          setState("success");

          // Refresh user credits + plan
          try {
            const me = await paymentService.refreshMe();
            const nextUser = me?.data?.user || me?.data || me;
            if (nextUser && typeof nextUser === "object") updateCurrentUser(nextUser);
          } catch {
            // non-critical
          }
        } catch (e: any) {
          console.error("Payment verification failed:", e?.message);
          setState("failed");
        }
      };

      run();
    }
  }, [params, updateCurrentUser]);

  // Auto-redirect to billing only on success
  React.useEffect(() => {
    if (state !== "success") return;
    const t = window.setTimeout(() => navigate("/billing"), 4000);
    return () => window.clearTimeout(t);
  }, [state, navigate]);

  if (state === "verifying") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-16 w-16 text-indigo-500 animate-spin" />
          <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
            Verifying payment…
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-red-200 bg-white p-6 sm:p-10 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
            Payment not completed
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Your payment was not captured. No charges were made.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={() => navigate("/pricing")}
              className="h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
            >
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/billing")}
              className="h-11 rounded-xl"
            >
              Go to Billing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
