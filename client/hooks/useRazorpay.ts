import { useCallback, useEffect, useRef, useState } from "react";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadRazorpayScript()
      .then(() => {
        if (mounted.current) setReady(true);
      })
      .catch(() => {
        if (mounted.current) setReady(false);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  const open = useCallback(
    (options: any) => {
      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay is not available. Please try again.");
      }
      const rzp = new RazorpayCtor(options);
      rzp.open();
    },
    [],
  );

  return { ready, open };
}

