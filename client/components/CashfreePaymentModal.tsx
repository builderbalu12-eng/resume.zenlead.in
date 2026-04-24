import * as React from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  planName?: string | null;
}

export function CashfreePaymentModal({ isOpen, onClose, planName }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
              Secure Payment
            </p>
            {planName && (
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                {planName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close payment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cashfree renders here */}
        <div
          id="cashfree-payment-container"
          className="min-h-[420px] p-2"
        />

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-3">
          Payments secured by Cashfree
        </p>
      </div>
    </div>
  );
}
