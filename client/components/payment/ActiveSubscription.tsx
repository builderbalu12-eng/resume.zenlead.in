import * as React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "./Spinner";
import type { SubscriptionItem } from "@/services/paymentService";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ActiveSubscription({
  subscription,
  onCancel,
  canceling,
}: {
  subscription: SubscriptionItem | null;
  onCancel: (id: string) => void;
  canceling: boolean;
}) {
  if (!subscription) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No active subscription.
        </p>
      </div>
    );
  }

  const statusColor =
    subscription.status === "active"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Active Subscription
            </h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor}`}>
              {subscription.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{subscription.plan_name}</span> •{" "}
            <span className="capitalize">{subscription.billing_cycle}</span> •{" "}
            {formatINR(subscription.amount_paid)} {subscription.currency}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Renews on {new Date(subscription.renewal_date).toLocaleDateString()}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={canceling}
              className="h-11 rounded-xl"
            >
              {canceling ? (
                <>
                  <Spinner className="mr-2" />
                  Canceling…
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel your active subscription. You may lose renewal benefits.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onCancel(subscription._id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel subscription
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

