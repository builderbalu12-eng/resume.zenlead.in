import * as React from 'react';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Sparkles, ChevronDown } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage?: (msg: string) => void;
}

export function ChatWindow({ messages, isLoading, onSendMessage }: ChatWindowProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = React.useState(false);
  const hasMessages = messages.length > 0;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // Auto-scroll to bottom when messages/loading change
  React.useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  // Show "scroll to bottom" button when user scrolled up
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-[#FDF6EE] dark:bg-background">
      {/* Scrollable area — plain div so scrollTop works directly */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
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
                  Hi, I'm Nova 👋
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  i help you find the best next job. i scan thousands of roles daily to find the right one for you.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-6 px-4 max-w-2xl mx-auto w-full">
              {messages.map((message, index) => (
                <MessageBubble
                  key={`${message.timestamp}-${index}`}
                  message={message}
                  onSendMessage={onSendMessage}
                />
              ))}
              {isLoading && !messages.some((m: any) => m._streamId) && <TypingIndicator />}
              {/* Invisible anchor for scroll-to-bottom */}
              <div ref={bottomRef} className="h-1" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll-to-bottom floating button */}
      {showScrollBtn && hasMessages && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-card border border-border shadow-md hover:shadow-lg hover:bg-muted transition-all"
          title="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4 text-foreground" />
        </button>
      )}
    </div>
  );
}
