import * as React from 'react';
import { cn } from '@/lib/utils';
import { Briefcase, MapPin, Users, FileText } from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  query: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Find Jobs',
    description: 'Search live job openings for my role',
    query: 'Find me jobs that match my skills and experience',
    color: 'group-hover:bg-violet-100 group-hover:text-violet-600 dark:group-hover:bg-violet-900/30 dark:group-hover:text-violet-400',
  },
  {
    icon: <MapPin className="h-4 w-4" />,
    label: 'Find Clients',
    description: 'Discover local business leads near you',
    query: 'Find me business leads in my city',
    color: 'group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/30 dark:group-hover:text-emerald-400',
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: 'Find Freelancers',
    description: 'Hire skilled freelancers for your project',
    query: 'I need to find a freelancer for my project',
    color: 'group-hover:bg-sky-100 group-hover:text-sky-600 dark:group-hover:bg-sky-900/30 dark:group-hover:text-sky-400',
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: 'Tailor Resume',
    description: 'Optimize my resume for a specific job',
    query: 'Tailor my resume for a job — paste the job description and I\'ll optimize it',
    color: 'group-hover:bg-amber-100 group-hover:text-amber-600 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400',
  },
];

interface QuickActionsProps {
  onAction: (query: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.query)}
            disabled={disabled}
            className={cn(
              'group flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-background p-3.5',
              'text-left transition-all duration-150',
              'hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors', action.color)}>
              {action.icon}
            </span>
            <span className="text-xs font-semibold text-foreground">{action.label}</span>
            <span className="text-[11px] text-muted-foreground leading-snug">{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
