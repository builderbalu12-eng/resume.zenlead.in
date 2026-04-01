import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 p-4">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500">
        <Loader2 className="h-4 w-4 text-white animate-spin" />
      </div>

      {/* Typing Dots */}
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <span
          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
