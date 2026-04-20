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

    // Placeholder assistant message updated incrementally
    const placeholderId = `stream-${Date.now()}`;
    const placeholderTs = new Date().toISOString();
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: placeholderTs,
      _streamId: placeholderId,
    } as any]);

    try {
      const request: SendMessageRequest = {
        session_id: currentSession,
        message: message.trim(),
      };

      // Accumulated items for incremental card rendering
      const accumulatedLeads: any[]       = [];
      const accumulatedJobs: any[]        = [];
      const accumulatedFreelancers: any[] = [];
      let sessionResolved = false;

      for await (const event of chatApi.sendMessageStream(request)) {
        if (event.type === 'session' && !sessionResolved) {
          sessionResolved = true;
          if (!currentSession && event.session_id) {
            skipNextHistory.current = true;
            onSessionSelect(event.session_id);
          }
        }

        if (event.type === 'progress') {
          setMessages((prev) => prev.map((m: any) =>
            m._streamId === placeholderId
              ? {
                  ...m,
                  content: event.step_label || 'Processing…',
                  action_type: event.action_type,
                  action_data: {
                    _progress: {
                      step: event.step,
                      total: event.total_steps,
                      label: event.step_label,
                    },
                  },
                }
              : m
          ));
        }

        if (event.type === 'item') {
          const actionType: string = event.action_type;
          const item = event.item;

          if (actionType === 'leads_results') {
            accumulatedLeads.push(item);
            setMessages((prev) => prev.map((m: any) =>
              m._streamId === placeholderId
                ? { ...m, content: `finding leads…`, action_type: 'leads_results',
                    action_data: { leads: [...accumulatedLeads], city: event.meta?.city, category: event.meta?.category } }
                : m
            ));
          } else if (actionType === 'jobs_results') {
            accumulatedJobs.push(item);
            setMessages((prev) => prev.map((m: any) =>
              m._streamId === placeholderId
                ? { ...m, content: `finding jobs…`, action_type: 'jobs_results',
                    action_data: { jobs: [...accumulatedJobs] } }
                : m
            ));
          } else if (actionType === 'freelancers_results') {
            accumulatedFreelancers.push(item);
            setMessages((prev) => prev.map((m: any) =>
              m._streamId === placeholderId
                ? { ...m, content: `finding freelancers…`, action_type: 'freelancers_results',
                    action_data: { freelancers: [...accumulatedFreelancers] } }
                : m
            ));
          }
        }

        if (event.type === 'done') {
          // Build final action_data: merge accumulated items with done metadata
          let finalActionType = event.action_type;
          let finalActionData = event.action_data;

          if (accumulatedLeads.length) {
            finalActionType = 'leads_results';
            finalActionData = { ...(event.action_data || {}), leads: accumulatedLeads };
          } else if (accumulatedJobs.length) {
            finalActionType = 'jobs_results';
            finalActionData = { ...(event.action_data || {}), jobs: accumulatedJobs };
          } else if (accumulatedFreelancers.length) {
            finalActionType = 'freelancers_results';
            finalActionData = { ...(event.action_data || {}), freelancers: accumulatedFreelancers };
          }

          setMessages((prev) => prev.map((m: any) =>
            m._streamId === placeholderId
              ? {
                  role: 'assistant',
                  content: event.response || '',
                  intent: event.intent,
                  action_type: finalActionType,
                  action_data: finalActionData,
                  timestamp: event.timestamp || placeholderTs,
                }
              : m
          ));
          onSessionsChange();
        }

        if (event.type === 'error') {
          setMessages((prev) => prev.map((m: any) =>
            m._streamId === placeholderId
              ? { ...m, content: event.message || 'something went wrong.' }
              : m
          ));
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to send message';
      if (errMsg.toLowerCase().includes('insufficient') || errMsg.toLowerCase().includes('credits')) {
        toast.error('Not enough credits. Visit /pricing to buy more.');
      } else {
        toast.error(errMsg);
      }
      setMessages((prev) => prev.filter((m: any) => m._streamId !== placeholderId));
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
        <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={sendMessage} />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
