import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="max-w-[72%]">
          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 text-right pr-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* AI Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm mt-0.5">
        <Sparkles className="h-4 w-4 text-white" />
      </div>

      {/* AI Message - no bubble, plain text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-semibold text-foreground mb-1.5">Maya</p>
        <div
          className={cn(
            'text-sm leading-relaxed text-foreground',
            '[&_p]:mb-3 [&_p]:last:mb-0',
            '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
            '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
            '[&_li]:leading-relaxed',
            '[&_strong]:font-semibold [&_strong]:text-foreground',
            '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-1',
            '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1',
            '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-1',
            '[&_code]:bg-muted [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
            '[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:mb-3 [&_pre]:overflow-x-auto',
            '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground',
            '[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground'
          )}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {message.intent && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
              {message.intent.replace(/_/g, ' ')}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
