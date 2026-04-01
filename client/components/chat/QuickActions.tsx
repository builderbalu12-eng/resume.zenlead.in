import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search, Users, Building2, FileText, Lightbulb, Plus } from 'lucide-react';

interface QuickAction {
  icon?: React.ReactNode;
  text: string;
  query: string;
}

const quickActions: QuickAction[] = [
  { text: 'I am a freelancer', query: 'Find software developer jobs for me' },
  { text: 'I am a client looking for freelancer', query: 'Find freelancer candidates' },
];

const recentActions: QuickAction[] = [
  { icon: <Search className="h-3.5 w-3.5" />, text: 'Job Search Help', query: 'Help me search for jobs' },
  { icon: <Building2 className="h-3.5 w-3.5" />, text: 'Checking for Updates', query: 'What are the latest updates' },
  { icon: <FileText className="h-3.5 w-3.5" />, text: 'Freelance Web Agency Launch', query: 'Help with freelance web agency' },
];

interface QuickActionsProps {
  onAction: (query: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Main quick action pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.text}
            variant="outline"
            size="sm"
            onClick={() => onAction(action.query)}
            disabled={disabled}
            className={cn(
              'h-9 gap-1.5 rounded-full border-muted-foreground/20 bg-background px-4 text-sm',
              'hover:bg-muted/50 hover:border-muted-foreground/30',
              'transition-all duration-200'
            )}
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            {action.text}
          </Button>
        ))}
      </div>

      {/* Recent actions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {recentActions.map((action) => (
          <Button
            key={action.text}
            variant="ghost"
            size="sm"
            onClick={() => onAction(action.query)}
            disabled={disabled}
            className={cn(
              'h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground',
              'hover:bg-muted/50 hover:text-foreground',
              'transition-all duration-200'
            )}
          >
            {action.icon}
            {action.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
