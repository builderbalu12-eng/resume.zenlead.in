// TODO: Razorpay disabled — migrating to Cashfree
// Replace this file with useCashfree.ts when ready.

// Original implementation:
// import { useCallback, useEffect, useRef, useState } from "react";
// function loadRazorpayScript(): Promise<void> { ... }
// export function useRazorpay() { ... returns { ready, open } }

export function useRazorpay() {
  return {
    ready: false,
    open: (_options: any) => {
      throw new Error("Payment gateway not configured. Cashfree integration coming soon.");
    },
  };
}
