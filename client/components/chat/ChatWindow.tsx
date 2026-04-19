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
    <div className="flex-1 overflow-hidden bg-[#FDF6EE] dark:bg-background">
      <ScrollArea className="h-full" ref={scrollRef}>
        <div className="flex min-h-full flex-col">
          {!hasMessages ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[60vh]">
              <div className="relative mb-5">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-400 border-2 border-[#FDF6EE] dark:border-background" />
              </div>

              <div className="text-center space-y-1.5 max-w-xs">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  hi, i'm Nova 👋
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  i help you find the best next job. i scan thousands of roles daily to find the right one for you.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-6 px-4 max-w-2xl mx-auto w-full">
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
