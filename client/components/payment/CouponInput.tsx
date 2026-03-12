import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "./Spinner";

export function CouponInput({
  value,
  onChange,
  onApply,
  isApplying,
  error,
  appliedLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  isApplying: boolean;
  error: string | null;
  appliedLabel: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Have a coupon?
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Apply once — it will update all plan prices.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="SAVE10"
          className="h-11"
        />
        <Button
          type="button"
          onClick={onApply}
          disabled={isApplying || !value.trim()}
          className="h-11 bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          {isApplying ? (
            <>
              <Spinner className="mr-2" />
              Applying…
            </>
          ) : (
            "Apply"
          )}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {appliedLabel && !error && (
        <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
          {appliedLabel}
        </p>
      )}
    </div>
  );
}

