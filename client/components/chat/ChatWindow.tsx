import * as React from 'react';
import { cn } from '@/lib/utils';
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

  // Auto-scroll to bottom when messages change or loading state changes
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
            // Empty State - Centered Welcome
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground italic font-light">Hey There</p>
                <h2 className="text-3xl font-semibold text-foreground">
                  How can I help you today?
                </h2>
              </div>
            </div>
          ) : (
            // Messages
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
