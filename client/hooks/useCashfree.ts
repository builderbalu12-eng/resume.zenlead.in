import { useCallback } from "react";

declare global {
  interface Window {
    Cashfree: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        returnUrl?: string;
        redirectTarget?: "_self" | "_blank" | "_top" | HTMLElement;
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
      onModalClose,
    }: {
      paymentSessionId: string;
      onFailure?: (reason: string) => void;
      onModalClose?: () => void;
    }) => {
      if (!window.Cashfree) {
        onFailure?.("Cashfree SDK not loaded. Please refresh and try again.");
        return;
      }

      const cashfree = window.Cashfree({ mode: getCashfreeMode() });

      // Try to render inline inside the modal container div
      const container = document.getElementById("cashfree-payment-container");

      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: container ?? "_self",
      });

      if (result?.error) {
        onModalClose?.();
        onFailure?.(result.error.message || "Payment failed");
      }
      // On success: Cashfree redirects to return_url automatically
    },
    []
  );

  return { openCheckout };
}
