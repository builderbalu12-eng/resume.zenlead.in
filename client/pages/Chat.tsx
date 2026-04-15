import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi } from '@/services/chatApi';
import { ChatSession } from '@/types/chat';
import { toast } from 'sonner';
import { ChatContainer } from '@/components/chat';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSession = searchParams.get('session');
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await chatApi.getAllSessions();
      if (response.success) {
        // Only show sessions that have at least one message
        setSessions(response.data.sessions.filter((s: any) => s.message_count > 0));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsReady(true);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    if (sessionId) {
      setSearchParams({ session: sessionId });
    } else {
      setSearchParams({});
    }
  };

  const handleNewSession = async () => {
    // Silently delete all empty sessions first
    chatApi.cleanupEmptySessions().catch(() => {});
    // Clear ?session= from URL — backend auto-creates when user sends first message
    setSearchParams({});
    await loadSessions();
  };

  if (!isReady) {
    return (
      <div className="flex h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-6 md:-my-8">
        {/* Session list skeleton */}
        <div className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="p-3 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
        {/* Message area skeleton */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
          <div className="flex gap-3 items-end">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-16 w-56 rounded-2xl rounded-bl-none" />
          </div>
          <div className="flex gap-3 items-end justify-end">
            <Skeleton className="h-12 w-64 rounded-2xl rounded-br-none" />
          </div>
          <div className="flex gap-3 items-end">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-20 w-72 rounded-2xl rounded-bl-none" />
          </div>
          <div className="flex gap-3 items-end justify-end">
            <Skeleton className="h-10 w-48 rounded-2xl rounded-br-none" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-6 md:-my-8">
      <ChatContainer
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSessionSelect={handleSessionSelect}
        onSessionsChange={loadSessions}
      />
    </div>
  );
}
