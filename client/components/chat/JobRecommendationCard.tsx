import { useState } from 'react';
import {
  ExternalLink, Check, Building2, MapPin, Briefcase,
  DollarSign, Star, BarChart2, Search, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/services/chatApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface JobCard {
  Title: string;
  Company: string;
  Location: string;
  Experience?: string;
  Salary?: string;
  Site?: string;
  Type?: string;
  URL?: string;
  pitch?: string;
}

interface JobRecommendationCardProps {
  job: JobCard;
  index: number;
  total: number;
  onSendMessage?: (msg: string) => void;
}

const SITE_COLORS: Record<string, string> = {
  naukri:       'bg-orange-50 text-orange-600 border-orange-200',
  linkedin:     'bg-blue-50 text-blue-600 border-blue-200',
  indeed:       'bg-indigo-50 text-indigo-600 border-indigo-200',
  glassdoor:    'bg-green-50 text-green-700 border-green-200',
  ziprecruiter: 'bg-red-50 text-red-600 border-red-200',
  shine:        'bg-yellow-50 text-yellow-700 border-yellow-200',
  monster:      'bg-violet-50 text-violet-600 border-violet-200',
};

export function JobRecommendationCard({ job, index, total, onSendMessage }: JobRecommendationCardProps) {
  const [tracked, setTracked]   = useState(false);
  const [skipped, setSkipped]   = useState(false);
  const [tracking, setTracking] = useState(false);

  const handleTrack = async () => {
    setTracking(true);
    try {
      await chatApi.saveJobInterest({
        job_title: job.Title,
        company:   job.Company,
        job_url:   job.URL || '',
        location:  job.Location,
      });
      setTracked(true);
      toast.success('Added to Tracker!');
    } catch {
      toast.error('Failed to save job');
    } finally {
      setTracking(false);
    }
  };

  const handleEvaluate = () => {
    if (!onSendMessage) return;
    const jd = [
      job.Title && `Job Title: ${job.Title}`,
      job.Company && `Company: ${job.Company}`,
      job.Location && `Location: ${job.Location}`,
      job.Experience && `Experience: ${job.Experience}`,
      job.Salary && `Salary: ${job.Salary}`,
      job.URL && `Job URL: ${job.URL}`,
    ].filter(Boolean).join('\n');
    onSendMessage(`evaluate job:\n${jd}`);
  };

  const handleResearch = () => {
    if (!onSendMessage) return;
    onSendMessage(`research company ${job.Company}`);
  };

  const handleTailor = () => {
    if (!onSendMessage) return;
    const jd = [
      job.Title    && `Job Title: ${job.Title}`,
      job.Company  && `Company: ${job.Company}`,
      job.Location && `Location: ${job.Location}`,
      job.Experience && `Experience: ${job.Experience}`,
      job.Salary   && `Salary: ${job.Salary}`,
      job.URL      && `Job URL: ${job.URL}`,
    ].filter(Boolean).join('\n');
    onSendMessage(`tailor my resume for:\n${jd}`);
  };

  if (skipped) {
    return (
      <div className="mt-2 rounded-2xl border border-border/30 bg-muted/20 px-4 py-2.5 opacity-40">
        <p className="text-xs text-muted-foreground line-through">
          {job.Title} · {job.Company}
        </p>
      </div>
    );
  }

  const siteLabel = job.Site?.toLowerCase() || '';
  const siteChipClass = SITE_COLORS[siteLabel] || 'bg-muted/60 text-muted-foreground border-border/40';

  return (
    <div
      className={cn(
        'mt-2 rounded-2xl border bg-white dark:bg-card overflow-hidden transition-all duration-200',
        tracked
          ? 'border-green-300 shadow-sm shadow-green-100'
          : 'border-border/60 shadow-sm hover:shadow-md hover:border-border',
      )}
    >
      {/* Tracked banner */}
      {tracked && (
        <div className="flex items-center gap-1.5 bg-green-50 px-4 py-1.5 border-b border-green-100">
          <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-700">Added to Tracker</span>
        </div>
      )}

      <div className="p-4 pb-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug">
              {job.Title}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <span className="font-medium truncate">{job.Company}</span>
            </div>
          </div>
          {job.URL && (
            <a
              href={job.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              title="Apply"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Meta chips row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.Location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {job.Location}
            </span>
          )}
          {job.Experience && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Briefcase className="h-2.5 w-2.5" />
              {job.Experience}
            </span>
          )}
          {job.Salary && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <DollarSign className="h-2.5 w-2.5" />
              {job.Salary}
            </span>
          )}
          {job.Type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] text-sky-700">
              {job.Type}
            </span>
          )}
          {siteLabel && (
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', siteChipClass)}>
              {siteLabel.charAt(0).toUpperCase() + siteLabel.slice(1)}
            </span>
          )}
        </div>

        {/* AI pitch */}
        {job.pitch && (
          <p className="text-xs text-violet-700 dark:text-violet-400 leading-relaxed italic border-l-2 border-violet-300 pl-2.5 mb-3 bg-violet-50 dark:bg-violet-950/20 rounded-r py-1">
            {job.pitch}
          </p>
        )}

        {/* Action row */}
        <div className="flex gap-1.5 flex-wrap">
          {/* Track button */}
          {!tracked ? (
            <Button
              size="sm"
              className="h-7 text-[11px] gap-1 bg-green-600 hover:bg-green-700 text-white border-0 px-3 rounded-full"
              onClick={handleTrack}
              disabled={tracking}
            >
              <Star className="h-3 w-3" />
              {tracking ? 'Saving…' : 'Track'}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-green-50 border border-green-200 text-[11px] font-medium text-green-700">
              <Check className="h-3 w-3" /> Tracked
            </span>
          )}

          {/* Evaluate button */}
          {onSendMessage && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 px-3 rounded-full border-violet-200 text-violet-700 hover:bg-violet-50"
              onClick={handleEvaluate}
            >
              <BarChart2 className="h-3 w-3" />
              Evaluate
            </Button>
          )}

          {/* Research company button */}
          {onSendMessage && job.Company && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 px-3 rounded-full border-sky-200 text-sky-700 hover:bg-sky-50"
              onClick={handleResearch}
            >
              <Search className="h-3 w-3" />
              Research
            </Button>
          )}

          {/* Tailor resume button */}
          {onSendMessage && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 px-3 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={handleTailor}
            >
              <FileText className="h-3 w-3" />
              Tailor
            </Button>
          )}

          {/* Skip */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] px-2 rounded-full text-muted-foreground/60 hover:text-muted-foreground ml-auto"
            onClick={() => setSkipped(true)}
          >
            Skip
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/50">{index + 1} of {total}</span>
        {job.URL && (
          <a
            href={job.URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            View & Apply <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
