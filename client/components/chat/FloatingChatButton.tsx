import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChatContainer } from './ChatContainer';
import { chatApi } from '@/services/chatApi';
import { ChatSession } from '@/types/chat';

interface FloatingChatButtonProps {
  className?: string;
}

export function FloatingChatButton({ className }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentSession, setCurrentSession] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const navigate = useNavigate();

  // Load sessions when opened
  React.useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      const response = await chatApi.getAllSessions();
      if (response.success) {
        const withMessages = response.data.sessions.filter((s: any) => s.message_count > 0);
        setSessions(withMessages);
        if (!currentSession && withMessages.length > 0) {
          const mostRecent = [...withMessages].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0];
          setCurrentSession(mostRecent.session_id);
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const createNewSession = async () => {
    chatApi.cleanupEmptySessions().catch(() => {});
    setCurrentSession(null);
    await loadSessions();
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSession(sessionId || null);
  };

  const handleExpand = () => {
    setIsOpen(false);
    navigate('/chat');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
            'bg-gradient-to-r from-purple-500 to-pink-500',
            'hover:from-purple-600 hover:to-pink-600 hover:scale-110',
            'transition-all duration-300 hover:shadow-xl',
            className
          )}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]',
            'rounded-2xl border bg-card shadow-2xl',
            'animate-in fade-in slide-in-from-bottom-4 duration-300'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpand}
                className="text-xs"
              >
                Expand
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Container */}
          <div className="h-[500px] overflow-hidden">
            <ChatContainer
              currentSession={currentSession}
              sessions={sessions}
              onNewSession={createNewSession}
              onSessionSelect={handleSessionSelect}
              onSessionsChange={loadSessions}
              hideSidebar
            />
          </div>
        </div>
      )}
    </>
  );
}
