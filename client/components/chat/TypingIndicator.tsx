import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-6 animate-in fade-in duration-200">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm mt-0.5">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold text-foreground/60 mb-1">Nova</p>
        <div className="inline-flex items-center gap-1 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-border/40 px-3 py-2.5 h-9">
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1s' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1s' }}
          />
        </div>
      </div>
    </div>
  );
}
