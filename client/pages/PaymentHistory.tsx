import React, { useState, useEffect } from 'react';
import { Loader, CreditCard, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, PaymentLog } from '@/services/api';

export const PaymentHistory: React.FC = () => {
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

        // Calculate totals
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '•';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Loader className="h-12 w-12 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Payment History
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View all your transactions and credit purchases
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Total Spent */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">
                  Total Spent
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                <CreditCard className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Total Credits */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">
                  Total Credits Purchased
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {totalCredits}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                No Payment History
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                You haven't made any payments yet. Start by purchasing credits!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={log._id}
                      className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {log.transaction_id
                          ? log.transaction_id.substring(0, 12) + '...'
                          : log._id.substring(0, 12) + '...'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-bold">
                        {log.amount_paid.toFixed(2)} {log.currency}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-100 font-bold">
                        +{log.credits_added}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1.5 rounded-full font-bold text-xs border-2 capitalize ${getStatusColor(log.status)}`}>
                          <span className="mr-1">{getStatusIcon(log.status)}</span>
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

        {/* Download Statement */}
        {logs.length > 0 && (
          <div className="mt-8 text-center">
            <button
              className="px-6 py-3 rounded-lg border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 font-bold transition-all"
            >
              Download Statement (CSV)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
