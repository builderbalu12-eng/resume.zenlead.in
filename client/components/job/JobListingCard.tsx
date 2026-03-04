import React from 'react';
import { ExternalLink, MapPin, Briefcase, TrendingUp, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobListingCardProps {
  job: any;
}

export const JobListingCard: React.FC<JobListingCardProps> = ({ job }) => {
  const getSiteColor = (site: string) => {
    const colors: Record<string, string> = {
      linkedin: 'from-blue-500 to-blue-600',
      indeed: 'from-blue-600 to-blue-700',
      naukri: 'from-purple-500 to-purple-600',
      google: 'from-yellow-500 to-yellow-600',
    };
    return colors[site?.toLowerCase()] || 'from-slate-500 to-slate-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 p-6 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-lg transition-all">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
        {/* Main Content */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${getSiteColor(job.site)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
              {job.site?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate hover:text-purple-600 dark:hover:text-purple-400">
                {job.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                {job.company}
              </p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 items-center text-sm">
            {job.location && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{job.location}</span>
              </div>
            )}

            {job.salary && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span>{job.salary}</span>
              </div>
            )}

            {job.is_remote === true && (
              <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                Remote
              </span>
            )}

            {job.job_type && (
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                {job.job_type}
              </span>
            )}
          </div>

          {/* Description Summary */}
          {job.description_summary && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {job.description_summary}
            </p>
          )}

          {/* Keywords */}
          {(job.matched_keywords || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Matched Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.matched_keywords.slice(0, 3).map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold"
                  >
                    ✓ {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {(job.missing_keywords || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.missing_keywords.slice(0, 2).map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold"
                  >
                    ✗ {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {(job.risk_flags || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Things to Note</p>
              <div className="space-y-1">
                {job.risk_flags.slice(0, 2).map((flag: string, idx: number) => (
                  <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                    ⚠️ {flag}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Score & Action */}
        <div className="flex flex-col items-end justify-between md:min-w-[150px]">
          {/* Score */}
          <div className="text-center">
            <div className={`text-4xl font-black ${getScoreColor(job.fit_score)}`}>
              {job.fit_score}%
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Fit Score</p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => window.open(job.job_url, '_blank')}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 mt-4 w-full md:w-auto"
          >
            <span>View Job</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reasoning (if available) */}
      {job.reasoning && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Why it matches:</span> {job.reasoning}
          </p>
        </div>
      )}
    </div>
  );
};
