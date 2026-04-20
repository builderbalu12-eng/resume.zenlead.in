import { ExternalLink, MapPin, Github, Linkedin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Freelancer {
  user_id: string;
  name: string;
  freelance_bio?: string;
  freelance_skills: string[];
  hourly_rate?: number;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  location?: string;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
];

interface Props {
  freelancer: Freelancer;
  index?: number;
}

export function FreelancerCard({ freelancer: f, index = 0 }: Props) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const visibleSkills = f.freelance_skills.slice(0, 4);
  const extra = f.freelance_skills.length - visibleSkills.length;

  return (
    <div className="mt-2 rounded-2xl border bg-white dark:bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 pb-3">
        {/* Header: avatar + name + rate */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              'bg-gradient-to-br text-white text-sm font-bold',
              gradient,
            )}
          >
            {initials(f.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">{f.name || 'Anonymous'}</p>
            {f.location && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {f.location}
              </span>
            )}
          </div>
          {f.hourly_rate != null && f.hourly_rate > 0 ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              ${f.hourly_rate}/hr
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center rounded-full bg-muted/60 border border-border/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              Open to discuss
            </span>
          )}
        </div>

        {/* Bio */}
        {f.freelance_bio && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {f.freelance_bio}
          </p>
        )}

        {/* Skills */}
        {visibleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-muted/50 border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {s}
              </span>
            ))}
            {extra > 0 && (
              <span className="inline-flex items-center rounded-full bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground/60">
                +{extra} more
              </span>
            )}
          </div>
        )}

        {/* Action links */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {f.portfolio_url && (
            <a
              href={f.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 h-7 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 text-[11px] font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
            >
              <Globe className="h-3 w-3" />
              Portfolio
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
          {f.linkedin_url && (
            <a
              href={f.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 h-7 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 text-[11px] font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </a>
          )}
          {f.github_url && (
            <a
              href={f.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 h-7 rounded-full border border-border/60 bg-muted/40 px-3 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Github className="h-3 w-3" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
