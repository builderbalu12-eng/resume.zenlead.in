import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, AlertCircle, Calendar, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobCardProps {
  job: any;
}

const SITE_LABEL: Record<string, string> = {
  indeed: 'Indeed',
  linkedin: 'LinkedIn',
  naukri: 'Naukri',
  google: 'Google',
};

const SITE_DOT: Record<string, string> = {
  indeed: 'bg-blue-500',
  linkedin: 'bg-indigo-500',
  naukri: 'bg-orange-400',
  google: 'bg-emerald-500',
};

function scoreStyle(score: number) {
  if (score >= 80) return { bar: 'bg-green-500', num: 'text-green-600 dark:text-green-400' };
  if (score >= 60) return { bar: 'bg-amber-400', num: 'text-amber-600 dark:text-amber-400' };
  if (score >= 40) return { bar: 'bg-orange-500', num: 'text-orange-600 dark:text-orange-400' };
  return { bar: 'bg-red-500', num: 'text-red-600 dark:text-red-400' };
}

const tagBase = 'inline-flex items-center gap-1 rounded border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground';

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [expanded, setExpanded] = useState(false);

  const siteKey = (job.site ?? '').toLowerCase();
  const siteLabel = SITE_LABEL[siteKey] ?? job.site ?? 'Job';
  const siteDot = SITE_DOT[siteKey] ?? 'bg-slate-400';
  const score = job.fit_score ?? 0;
  const { bar, num } = scoreStyle(score);

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md">

      {/* ── Header ──────────────────────────────── */}
      <div className="p-4 space-y-3">

        {/* Tags row + score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Site tag */}
            <span className={tagBase}>
              <span className={`h-1.5 w-1.5 rounded-full ${siteDot}`} />
              {siteLabel}
            </span>
            {job.is_remote && (
              <span className={tagBase}>Remote</span>
            )}
            {job.job_type && (
              <span className={`${tagBase} capitalize`}>{job.job_type}</span>
            )}
          </div>

          {/* Score — compact bar + number, not a big circle */}
          {score > 0 && (
            <div className="shrink-0 flex flex-col items-end gap-1 min-w-[52px]">
              <span className={`text-sm font-semibold tabular-nums leading-none ${num}`}>
                {score}%
              </span>
              <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${bar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground leading-none">match</span>
            </div>
          )}
        </div>

        {/* Title & company */}
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">
            {job.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[job.company, job.location].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────── */}
      <div className="px-4 pb-4 space-y-3">

        {/* Role label */}
        {job.best_role_label && (
          <span className={tagBase}>{job.best_role_label}</span>
        )}

        {/* Summary */}
        {job.description_summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {job.description_summary}
          </p>
        )}

        {/* Matched skills */}
        {(job.matched_keywords ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Matched skills</p>
            <div className="flex flex-wrap gap-1">
              {job.matched_keywords.slice(0, 4).map((kw: string, i: number) => (
                <span key={i} className="rounded px-2 py-0.5 text-[11px] font-medium bg-green-500/10 text-green-700 dark:text-green-400">
                  {kw}
                </span>
              ))}
              {job.matched_keywords.length > 4 && (
                <span className="rounded px-2 py-0.5 text-[11px] font-medium bg-green-500/10 text-green-700 dark:text-green-400">
                  +{job.matched_keywords.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {(job.missing_keywords ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Missing skills</p>
            <div className="flex flex-wrap gap-1">
              {job.missing_keywords.slice(0, 3).map((kw: string, i: number) => (
                <span key={i} className="rounded px-2 py-0.5 text-[11px] font-medium bg-red-500/10 text-red-700 dark:text-red-400">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta row — no emojis */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {job.date_posted && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(job.date_posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {job.experience && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {job.experience}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {job.salary}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────── */}
      <div className="px-4 py-2.5 border-t bg-muted/30 flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Details
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <Button
          size="sm"
          className="h-7 px-3 text-xs gap-1 bg-primary hover:bg-primary/90"
          onClick={() => window.open(job.job_url, '_blank')}
        >
          View Job
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* ── Expandable details ───────────────────── */}
      {expanded && (
        <div className="px-4 py-3 border-t bg-muted/20 space-y-3">
          {job.reasoning && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Why it matches</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{job.reasoning}</p>
            </div>
          )}

          {(job.risk_flags ?? []).length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Things to note</p>
              <div className="space-y-1">
                {job.risk_flags.map((flag: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.description && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Full description</p>
              <div className="max-h-48 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {job.description.substring(0, 1000)}
                {job.description.length > 1000 && '…'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
