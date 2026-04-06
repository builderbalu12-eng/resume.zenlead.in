import * as React from 'react';
import { chatApi } from '@/services/chatApi';
import { ChatSession } from '@/types/chat';
import { toast } from 'sonner';
import { ChatContainer } from '@/components/chat';

export default function ChatPage() {
  const [currentSession, setCurrentSession] = React.useState<string | null>(null);
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

  const handleNewSession = async () => {
    // Silently delete all empty sessions first
    chatApi.cleanupEmptySessions().catch(() => {});
    // Just clear current session — backend auto-creates when user sends first message
    setCurrentSession(null);
    await loadSessions();
  };

  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-6 md:-my-8">
      <ChatContainer
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSessionSelect={setCurrentSession}
        onSessionsChange={loadSessions}
      />
    </div>
  );
}
