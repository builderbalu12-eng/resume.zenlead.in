import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full',
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
            : 'bg-gradient-to-br from-cyan-500 to-blue-500'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            'prose prose-sm max-w-none px-4 py-3',
            isUser
              ? 'rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white'
              : 'rounded-2xl rounded-tl-sm bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          ) : (
            <div className={cn(
              "[&_p]:m-0 [&_p]:mb-2 [&_p]:last:mb-0",
              "[&_ul]:m-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4",
              "[&_ol]:m-0 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4",
              "[&_li]:mb-1",
              "[&_strong]:font-bold [&_strong]:text-primary",
              "[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2",
              "[&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2",
              "[&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1",
              "[&_code]:bg-primary/20 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs",
              "[&_pre]:bg-primary/10 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:mb-2",
              "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic"
            )}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 px-1">
          {message.intent && !isUser && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {message.intent.replace(/_/g, ' ')}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
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
