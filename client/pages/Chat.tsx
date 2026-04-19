import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi } from '@/services/chatApi';
import { ChatSession } from '@/types/chat';
import { ChatContainer } from '@/components/chat';
import { Skeleton } from '@/components/ui/skeleton';

const LAST_SESSION_KEY = 'nova_last_session';

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSession = searchParams.get('session');
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [isReady, setIsReady] = React.useState(false);

  // On mount: if no session in URL, restore from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem(LAST_SESSION_KEY);
    if (!currentSession && saved) {
      setSearchParams({ session: saved }, { replace: true });
    }
    loadSessions();
  }, []);

  // Persist active session to localStorage whenever it changes
  React.useEffect(() => {
    if (currentSession) {
      localStorage.setItem(LAST_SESSION_KEY, currentSession);
    }
  }, [currentSession]);

  const loadSessions = async () => {
    try {
      const response = await chatApi.getAllSessions();
      if (response.success) {
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
      localStorage.removeItem(LAST_SESSION_KEY);
    }
  };

  const handleNewSession = async () => {
    chatApi.cleanupEmptySessions().catch(() => {});
    setSearchParams({});
    localStorage.removeItem(LAST_SESSION_KEY);
    await loadSessions();
  };

  if (!isReady) {
    return (
      <div className="flex h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-6 md:-my-8">
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
