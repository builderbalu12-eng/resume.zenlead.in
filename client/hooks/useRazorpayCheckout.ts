import { useCallback } from "react";
import { useAppConfig } from "@/contexts/AppConfigContext";

interface RazorpaySubscriptionCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  theme?: { color: string; backdrop_color?: string };
  handler: (response: RazorpaySubscriptionResponse) => void;
  modal?: { ondismiss: () => void };
  prefill?: { name?: string; email?: string };
}

interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

export interface UseRazorpayCheckoutParams {
  subscriptionId: string;
  planName: string;
  onSuccess: (response: RazorpaySubscriptionResponse) => void;
  onFailure: (reason: string) => void;
}

export function useRazorpayCheckout() {
  const { app_name: appName } = useAppConfig();
  const openCheckout = useCallback(
    ({ subscriptionId, planName, onSuccess, onFailure }: UseRazorpayCheckoutParams) => {
      const RazorpayCtor = (window as { Razorpay?: new (o: RazorpaySubscriptionCheckoutOptions) => RazorpayInstance })
        .Razorpay;
      if (!RazorpayCtor) {
        onFailure("Razorpay is not available. Please try again.");
        return;
      }

      let successHandled = false;

      const options: RazorpaySubscriptionCheckoutOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
        subscription_id: subscriptionId,
        name: appName,
        description: planName,
        theme: {
          color: "#6366f1",
          backdrop_color: "rgba(0, 0, 0, 0.75)",
        },
        handler: (response) => {
          successHandled = true;
          onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            if (!successHandled) {
              onFailure("Payment cancelled");
            }
          },
        },
      };

      const rzp = new RazorpayCtor(options);
      rzp.open();
    },
    [appName]
  );

  return { openCheckout };
}
