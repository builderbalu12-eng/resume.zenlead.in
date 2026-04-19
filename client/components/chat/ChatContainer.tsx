import * as React from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
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
  const skipNextHistory = React.useRef(false);
  const contextInjected = React.useRef(false);

  React.useEffect(() => {
    if (currentSession) {
      if (skipNextHistory.current) {
        skipNextHistory.current = false;
        return;
      }
      loadHistory(currentSession);
    } else {
      setMessages([]);
      if (!contextInjected.current) {
        contextInjected.current = true;
        injectResumeCard();
      }
    }
  }, [currentSession]);

  const injectResumeCard = async () => {
    try {
      const res = await chatApi.getContextStatus();
      if (res?.data?.has_resume) {
        setMessages([{
          role: 'assistant',
          content: "i've loaded your resume.",
          timestamp: new Date().toISOString(),
          _type: 'resume_context',
        } as any]);
      }
    } catch {
      // ignore
    }
  };

  const loadHistory = async (sessionId: string) => {
    try {
      const response = await chatApi.getHistory(sessionId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch {
      toast.error('Failed to load chat history');
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

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
        if (!currentSession && response.data.session_id) {
          skipNextHistory.current = true;
          onSessionSelect(response.data.session_id);
        }

        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: response.data.message,
          intent: response.data.intent,
          action_type: response.data.action_type,
          action_data: response.data.action_data,
          timestamp: response.data.timestamp,
        }]);
        onSessionsChange();
      }
    } catch (error) {
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
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
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

      <div className="flex flex-1 flex-col min-w-0">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
