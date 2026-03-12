import * as React from "react";
import type { BillingHistoryItem } from "@/services/paymentService";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BillingTable({ items }: { items: BillingHistoryItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No billing records yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-600 dark:bg-slate-950/40 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Payment ID</th>
              <th className="px-4 py-3">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((it) => {
              const ok = it.payment_status === "succeeded";
              const statusClass = ok
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
              return (
                <tr key={it._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/30">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {new Date(it.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {it.plan_name}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(it.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>
                      {it.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {it.is_recurring ? "Recurring" : "One-time"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {it.payment_id || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {it.invoice_url ? (
                      <a
                        href={it.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

