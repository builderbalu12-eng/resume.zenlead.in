import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobListingCard } from './JobListingCard';

interface JobListPanelProps {
  list: any;
  onClose: () => void;
}

export const JobListPanel: React.FC<JobListPanelProps> = ({ list, onClose }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadListJobs();
  }, [list.list_id]);

  const loadListJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs/lists/${list.list_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        setError(data.error || 'Failed to load jobs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{list.search_term}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              📍 {list.location} • {list.total_jobs} jobs • {new Date(list.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 m-6 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">No jobs found</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {jobs.map(job => (
                <JobListingCard key={job.job_url} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-6 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
