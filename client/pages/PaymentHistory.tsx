import React, { useState, useEffect } from 'react';
import { Loader, CreditCard, TrendingUp, Calendar, ArrowLeft, Download, ShieldCheck, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, PaymentLog } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const PaymentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    const loadPaymentLogs = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getPaymentLogs(0, 100);
        const items = response.data?.items || response.items || [];
        setLogs(items);

        let spent = 0;
        let credits = 0;
        items.forEach((log: PaymentLog) => {
          if (log.status === 'succeeded') {
            spent += log.amount_paid;
            credits += log.credits_added;
          }
        });
        setTotalSpent(spent);
        setTotalCredits(credits);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment history');
      } finally {
        setIsLoading(false);
      }
    };
    loadPaymentLogs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'failed':
        return 'bg-rose-500/10 text-rose-600 border-rose-200';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Transaction ID", "Amount", "Currency", "Credits", "Status"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleDateString(),
      log.transaction_id || log._id,
      log.amount_paid.toFixed(2),
      log.currency,
      log.credits_added,
      log.status,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin border-t-cyan-500" />
            <Loader className="h-10 w-10 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Fetching Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black transition-all uppercase tracking-widest text-xs"
            >
               <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
                 <ArrowLeft className="h-4 w-4" />
               </div>
               Dashboard
            </button>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              Payment <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">History</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Transparent tracking of your career investments and credit balance.
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 px-8 flex items-center gap-2 group shadow-xl transition-all"
          >
            <Download className="h-5 w-5" /> Download Statement
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                <CreditCard className="h-32 w-32" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Career Spent</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                <TrendingUp className="h-32 w-32" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Credits Gained</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{totalCredits}</p>
              </div>
              <div className="h-16 w-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                <TrendingUp className="h-8 w-8 text-cyan-500" />
              </div>
           </div>
        </div>

        {/* List Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {error && (
            <div className="p-6 bg-rose-50 border-l-4 border-rose-500 m-6 rounded-r-xl">
              <p className="text-rose-700 font-bold">{error}</p>
            </div>
          )}

          {logs.length === 0 ? (
            <div className="p-32 text-center space-y-8">
              <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <History className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No transactions yet</h3>
                <p className="text-slate-500 font-medium">Your investment journey begins with your first credit purchase.</p>
              </div>
              <Button
                onClick={() => navigate("/pricing")}
                className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-10 py-6"
              >
                View Pricing
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                    <th className="px-10 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Investment</th>
                    <th className="px-10 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Benefit</th>
                    <th className="px-10 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-3">
                           <Calendar className="h-4 w-4 text-slate-300" />
                           <span className="text-sm font-black text-slate-900 dark:text-white">
                             {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter uppercase">
                          {log.transaction_id || log._id}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {log.amount_paid.toFixed(2)}
                        </span>
                        <span className="ml-1 text-[10px] font-black text-slate-400 uppercase">{log.currency}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <ShieldCheck className="h-4 w-4 text-emerald-500" />
                           <span className="text-lg font-black text-slate-900 dark:text-white">+{log.credits_added}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className={cn(
                          "inline-flex px-4 py-2 rounded-full font-black text-[10px] border-2 uppercase tracking-widest",
                          getStatusColor(log.status)
                        )}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
