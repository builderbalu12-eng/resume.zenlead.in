// TODO: Razorpay disabled — migrating to Cashfree
// Replace this file with useCashfreeCheckout.ts when ready.

// Original implementation used:
//   key: import.meta.env.VITE_RAZORPAY_KEY_ID
//   subscription_id: string  (Razorpay subscription id)
//   window.Razorpay constructor

import { useAppConfig } from "@/contexts/AppConfigContext";

export interface UseRazorpayCheckoutParams {
  subscriptionId: string;
  planName: string;
  onSuccess: (response: any) => void;
  onFailure: (reason: string) => void;
}

export function useRazorpayCheckout() {
  useAppConfig(); // keep hook call to avoid lint errors

  const openCheckout = ({ onFailure }: UseRazorpayCheckoutParams) => {
    onFailure("Payment gateway not configured. Cashfree integration coming soon.");
  };

  return { openCheckout };
}
