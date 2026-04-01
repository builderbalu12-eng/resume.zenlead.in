import * as React from 'react';
import { cn } from '@/lib/utils';
import { Briefcase, Users, Search, Lightbulb } from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  query: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Find Jobs',
    description: 'Search freelance & full-time roles',
    query: 'Help me find software developer jobs that match my skills',
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: 'Hire Talent',
    description: 'Find the right freelancer for your project',
    query: 'I need to find a qualified freelancer for my project',
  },
  {
    icon: <Search className="h-4 w-4" />,
    label: 'Career Advice',
    description: 'Get personalized career guidance',
    query: 'Give me personalized career advice based on my profile',
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Resume Tips',
    description: 'Improve your resume and profile',
    query: 'Help me improve my resume and professional profile',
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
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
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
