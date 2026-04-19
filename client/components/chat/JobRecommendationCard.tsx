import { useState } from 'react';
import { ExternalLink, ThumbsDown, ThumbsUp, Check, Building2, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/services/chatApi';
import { toast } from 'sonner';

export interface JobCard {
  Title: string;
  Company: string;
  Location: string;
  Experience?: string;
  Salary?: string;
  URL?: string;
  pitch?: string;
}

interface JobRecommendationCardProps {
  job: JobCard;
  index: number;
  total: number;
}

export function JobRecommendationCard({ job, index, total }: JobRecommendationCardProps) {
  const [state, setState] = useState<'idle' | 'interested' | 'skipped'>('idle');
  const [loading, setLoading] = useState(false);

  const handleInterested = async () => {
    setLoading(true);
    try {
      await chatApi.saveJobInterest({
        job_title: job.Title,
        company: job.Company,
        job_url: job.URL || '',
        location: job.Location,
      });
      setState('interested');
      toast.success('Added to your Tracker!');
    } catch {
      toast.error('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  if (state === 'skipped') {
    return (
      <div className="mt-2 rounded-2xl border border-border/30 bg-muted/20 px-4 py-2.5 opacity-50">
        <p className="text-xs text-muted-foreground line-through">
          {job.Title} · {job.Company}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200 ${
        state === 'interested' ? 'border-green-300 shadow-green-100' : 'border-border/60'
      }`}
    >
      {state === 'interested' && (
        <div className="flex items-center gap-1.5 bg-green-50 px-4 py-1.5 border-b border-green-200">
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="text-xs font-medium text-green-700">Added to Tracker ✓</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {job.Title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.Company}</span>
            </div>
          </div>
          {job.URL && (
            <a
              href={job.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              title="View job"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-2">
          {job.Location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {job.Location}
            </span>
          )}
          {job.Experience && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 shrink-0" />
              {job.Experience}
            </span>
          )}
        </div>

        {/* AI pitch */}
        {job.pitch && (
          <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-purple-300 pl-2.5 mb-3">
            {job.pitch}
          </p>
        )}

        {/* Actions */}
        {state === 'idle' && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setState('skipped')}
            >
              <ThumbsDown className="h-3 w-3" />
              Not interested
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0"
              onClick={handleInterested}
              disabled={loading}
            >
              <ThumbsUp className="h-3 w-3" />
              Yes, Interested
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 pb-2 flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground/60">{index + 1} of {total}</span>
        {job.Salary && (
          <span className="text-[10px] font-medium text-emerald-600">{job.Salary}</span>
        )}
      </div>
    </div>
  );
}
