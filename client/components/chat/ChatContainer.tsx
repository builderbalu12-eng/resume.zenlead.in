import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { ChatSession, ChatMessage, SendMessageRequest } from '@/types/chat';
import { chatApi } from '@/services/chatApi';
import { toast } from 'sonner';

interface ChatContainerProps {
  currentSession: string | null;
  sessions: ChatSession[];
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onSessionsChange: () => void;
}

export function ChatContainer({
  currentSession,
  sessions,
  onNewSession,
  onSessionSelect,
  onSessionsChange,
}: ChatContainerProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const hasMessages = messages.length > 0;

  // Load history when session changes
  React.useEffect(() => {
    if (currentSession) {
      loadHistory(currentSession);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  const loadHistory = async (sessionId: string) => {
    try {
      const response = await chatApi.getHistory(sessionId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // If no session, create one first
    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const response = await chatApi.createSession();
        if (response.success) {
          sessionId = response.data.session_id;
          onSessionSelect(sessionId);
          onSessionsChange();
        }
      } catch (error) {
        toast.error('Failed to create new chat session');
        return;
      }
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const request: SendMessageRequest = {
        session_id: sessionId,
        message: message.trim(),
      };

      const response = await chatApi.sendMessage(request);

      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.message,
          intent: response.data.intent,
          timestamp: response.data.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        onSessionsChange(); // Refresh sessions to update preview
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await chatApi.deleteSession(sessionId);
      if (response.success) {
        toast.success('Chat deleted');
        if (currentSession === sessionId) {
          onSessionSelect('');
          setMessages([]);
        }
        onSessionsChange();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete chat');
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block w-64 shrink-0">
        <ChatSidebar
          sessions={sessions}
          currentSession={currentSession}
          onSessionSelect={onSessionSelect}
          onNewSession={onNewSession}
          onDeleteSession={handleDeleteSession}
          disabled={isLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-background">
        <ChatWindow messages={messages} isLoading={isLoading} />
        {!hasMessages && <QuickActions onAction={sendMessage} disabled={isLoading} />}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
