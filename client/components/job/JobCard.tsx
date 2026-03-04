import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobCardProps {
  job: any;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [expanded, setExpanded] = useState(false);

  const getSiteColor = (site: string) => {
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      indeed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Indeed' },
      linkedin: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'LinkedIn' },
      naukri: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Naukri' },
      google: { bg: 'bg-green-100', text: 'text-green-700', label: 'Google' },
    };
    return colors[site?.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Job' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { ring: 'ring-green-500', bg: 'bg-green-100', text: 'text-green-700', label: 'Great Match' };
    if (score >= 60) return { ring: 'ring-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Good Match' };
    if (score >= 40) return { ring: 'ring-orange-500', bg: 'bg-orange-100', text: 'text-orange-700', label: 'Partial Match' };
    return { ring: 'ring-red-500', bg: 'bg-red-100', text: 'text-red-700', label: 'Low Match' };
  };

  const siteInfo = getSiteColor(job.site);
  const scoreInfo = getScoreColor(job.fit_score || 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header Row */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${siteInfo.bg} ${siteInfo.text}`}>
              {siteInfo.label}
            </span>
            {job.is_remote && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                Remote
              </span>
            )}
            {job.job_type && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 capitalize">
                {job.job_type}
              </span>
            )}
          </div>
          {/* Fit Score Circle */}
          <div className={`relative h-16 w-16 rounded-full ${scoreInfo.bg} flex items-center justify-center flex-shrink-0 ring-4 ${scoreInfo.ring}`}>
            <div className="text-center">
              <div className={`text-2xl font-black ${scoreInfo.text}`}>
                {job.fit_score}%
              </div>
              <div className={`text-xs font-bold ${scoreInfo.text}`}>
                Match
              </div>
            </div>
          </div>
        </div>

        {/* Job Title & Company */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {job.title}
          </h3>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {job.company} {job.location && `• ${job.location}`}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Best Role Label */}
        {job.best_role_label && (
          <p className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 w-fit font-semibold">
            {job.best_role_label}
          </p>
        )}

        {/* Summary */}
        {job.description_summary && (
          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
            {job.description_summary}
          </p>
        )}

        {/* Matched Keywords */}
        {(job.matched_keywords || []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">✓ Matched Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.matched_keywords.slice(0, 4).map((keyword: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg"
                >
                  {keyword}
                </span>
              ))}
              {job.matched_keywords.length > 4 && (
                <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
                  +{job.matched_keywords.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {(job.missing_keywords || []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">✗ Missing Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.missing_keywords.slice(0, 2).map((keyword: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta Row */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
          {job.date_posted && <span>📅 {new Date(job.date_posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
          {job.experience && <span>👤 {job.experience}</span>}
          {job.salary && <span>💰 {job.salary}</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          Details
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <Button
          size="sm"
          onClick={() => window.open(job.job_url, '_blank')}
          className="bg-purple-600 hover:bg-purple-700 gap-1"
        >
          View Job
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-4">
          {/* Reasoning */}
          {job.reasoning && (
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Why it matches:</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{job.reasoning}</p>
            </div>
          )}

          {/* Risk Flags */}
          {(job.risk_flags || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Things to note:</p>
              <div className="space-y-1">
                {job.risk_flags.map((flag: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Description */}
          {job.description && (
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Full description:</p>
              <div className="max-h-64 overflow-y-auto text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {job.description.substring(0, 1000)}
                {job.description.length > 1000 && '...'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
