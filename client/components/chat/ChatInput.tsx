import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUp, Briefcase, Zap, Users, Search, Lightbulb } from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  query: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Briefcase className="h-3.5 w-3.5" />,
    label: 'Find Jobs',
    query: 'Help me find software developer jobs that match my skills',
  },
  {
    icon: <Users className="h-3.5 w-3.5" />,
    label: 'Hire Talent',
    query: 'I need to find a qualified freelancer for my project',
  },
  {
    icon: <Search className="h-3.5 w-3.5" />,
    label: 'Career Advice',
    query: 'Give me personalized career advice based on my profile',
  },
  {
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    label: 'Resume Tips',
    query: 'Help me improve my resume and professional profile',
  },
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = 'Message Nova…' }: ChatInputProps) {
  const [message, setMessage] = React.useState('');
  const [powersOpen, setPowersOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleQuickAction = (query: string) => {
    setPowersOpen(false);
    onSend(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  const hasContent = message.trim().length > 0;

  return (
    <div className="bg-[#FDF6EE] dark:bg-background px-4 pb-5 pt-2">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Input row */}
        <div
          className={cn(
            'relative flex items-end gap-2 rounded-2xl border bg-white dark:bg-card px-4 py-3',
            'shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
            'transition-shadow duration-200',
            'focus-within:shadow-[0_2px_20px_rgba(99,102,241,0.12)] focus-within:border-primary/30'
          )}
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'min-h-[28px] max-h-[160px] resize-none border-0 bg-transparent px-0 py-1',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'placeholder:text-muted-foreground/50 text-sm leading-relaxed'
            )}
            rows={1}
          />

          <Button
            onClick={handleSubmit}
            disabled={disabled || !hasContent}
            size="icon"
            className={cn(
              'h-8 w-8 shrink-0 rounded-full transition-all duration-200',
              hasContent && !disabled
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center gap-2">
          {/* ⚡ Powers */}
          <Popover open={powersOpen} onOpenChange={setPowersOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={disabled}
                className="flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                <Zap className="h-3 w-3" />
                Powers
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-72 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.query)}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-2.5 text-left text-xs font-medium hover:bg-muted hover:border-primary/30 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Jobs shortcut */}
          <button
            onClick={() => !disabled && onSend('find me jobs matching my profile')}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-white dark:bg-card hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors disabled:opacity-50 shadow-sm"
          >
            <Briefcase className="h-3 w-3" />
            Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
