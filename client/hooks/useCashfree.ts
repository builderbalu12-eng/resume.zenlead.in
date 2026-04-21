import { useCallback } from "react";

declare global {
  interface Window {
    Cashfree: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        returnUrl?: string;
        redirectTarget?: "_self" | "_blank" | "_top";
      }) => Promise<{ error?: { message: string }; redirect?: boolean }>;
    };
  }
}

function getCashfreeMode(): "sandbox" | "production" {
  return (import.meta.env.VITE_CASHFREE_ENV as "sandbox" | "production") || "sandbox";
}

export function useCashfree() {
  const openCheckout = useCallback(
    async ({
      paymentSessionId,
      onFailure,
    }: {
      paymentSessionId: string;
      onFailure?: (reason: string) => void;
    }) => {
      if (!window.Cashfree) {
        onFailure?.("Cashfree SDK not loaded. Please refresh and try again.");
        return;
      }

      const cashfree = window.Cashfree({ mode: getCashfreeMode() });

      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

      if (result?.error) {
        onFailure?.(result.error.message || "Payment failed");
      }
      // on success: Cashfree redirects to return_url automatically
    },
    []
  );

  return { openCheckout };
}
