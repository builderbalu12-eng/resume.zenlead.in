import * as React from 'react';
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
  hideSidebar?: boolean;
}

export function ChatContainer({
  currentSession,
  sessions,
  onNewSession,
  onSessionSelect,
  onSessionsChange,
  hideSidebar = false,
}: ChatContainerProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const hasMessages = messages.length > 0;
  // Prevent loadHistory from overwriting state when we just created a new session mid-send
  const skipNextHistory = React.useRef(false);

  // Load history when session changes
  React.useEffect(() => {
    if (currentSession) {
      if (skipNextHistory.current) {
        skipNextHistory.current = false;
        return;
      }
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
        session_id: currentSession,
        message: message.trim(),
      };

      const response = await chatApi.sendMessage(request);

      if (response.success) {
        // If no session existed, backend auto-created one — sync it to state
        // Set flag so the resulting useEffect doesn't reload history and wipe action_data
        if (!currentSession && response.data.session_id) {
          skipNextHistory.current = true;
          onSessionSelect(response.data.session_id);
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.message,
          intent: response.data.intent,
          action_type: response.data.action_type,
          action_data: response.data.action_data,
          timestamp: response.data.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        onSessionsChange(); // Refresh sessions to update preview
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to send message';
      if (errMsg.toLowerCase().includes('insufficient')) {
        toast.error('Not enough credits. Visit /pricing to buy more.');
      } else {
        toast.error(errMsg);
      }
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
      {/* Sidebar - hidden on mobile and when hideSidebar=true */}
      {!hideSidebar && (
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
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-background">
        <ChatWindow messages={messages} isLoading={isLoading} />
        {!hasMessages && <QuickActions onAction={sendMessage} disabled={isLoading} />}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
