import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface JobRecommendModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const JobRecommendModal: React.FC<JobRecommendModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'search' | 'loading' | 'complete'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [resumeId, setResumeId] = useState<string>('');

  // Get the user's current resume ID on load
  useEffect(() => {
    const getResumeId = async () => {
      try {
        const response = await fetch('/api/resumes/incoming', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        const data = await response.json();
        if (data.resumes?.[0]) {
          setResumeId(data.resumes[0]._id);
        }
      } catch (err) {
        console.error('Failed to get resume:', err);
      }
    };
    getResumeId();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm || !location) {
      setError('Please fill all fields');
      return;
    }

    if (!resumeId) {
      setError('No resume found. Please upload a resume first.');
      return;
    }

    setStep('loading');
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          resume_id: resumeId,
          search_term: searchTerm,
          location: location,
          results_per_site: 20,
          hours_old: 7 * 24,
          sites: ['linkedin', 'indeed', 'google'],
          is_remote: null,
          include_naukri: true,
          naukri_pages: 2,
          top_n: 15,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResultCount(data.total_returned || 0);
        setStep('complete');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(data.detail || 'Search failed');
        setStep('search');
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setStep('search');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find Jobs</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'search' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Job Title
                </label>
                <Input
                  placeholder="e.g., Full Stack Developer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSearching}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Location
                </label>
                <Input
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSearching}
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={handleSearch}
                disabled={!searchTerm || !location || isSearching}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search Jobs'
                )}
              </Button>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-slate-600 dark:text-slate-400 text-center font-semibold">
                Scraping and ranking jobs...
              </p>
              <p className="text-xs text-slate-500 text-center">
                This may take a minute
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-slate-900 dark:text-white font-bold text-center">
                Found {resultCount} matched jobs!
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Redirecting to your recommendations...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
