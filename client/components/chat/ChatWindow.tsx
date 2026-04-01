import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Sparkles } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  React.useEffect(() => {
    if (scrollRef.current && hasMessages) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isLoading, hasMessages]);

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full" ref={scrollRef}>
        <div className="flex min-h-full flex-col">
          {!hasMessages ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[60vh]">
              {/* AI Avatar */}
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-400 border-2 border-background" />
              </div>

              <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                  How can I help you?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask me anything about freelancing, jobs, or building your career.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-8 px-4 max-w-3xl mx-auto w-full">
              {messages.map((message, index) => (
                <MessageBubble key={`${message.timestamp}-${index}`} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
