import * as React from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
import { ChatSession, ChatMessage, SendMessageRequest } from '@/types/chat';
import { chatApi } from '@/services/chatApi';
import { toast } from 'sonner';
import { apiClient } from '@/services/api';

interface ChatContainerProps {
  currentSession: string | null;
  sessions: ChatSession[];
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onSessionsChange: () => void;
  hideSidebar?: boolean;
}

type OnboardingStep = 'name' | 'company' | 'role' | 'city' | 'mobility' | null;

function makeAIMessage(content: string): ChatMessage {
  return {
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
  };
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

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = React.useState<OnboardingStep>(null);
  const [onboardingData, setOnboardingData] = React.useState({
    name: '',
    company: '',
    role: '',
    city: '',
    mobility: '',
  });
  const onboardingChecked = React.useRef(false);

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
      // Check onboarding + context once per fresh session
      if (!onboardingChecked.current) {
        onboardingChecked.current = true;
        checkSessionContext();
      }
    }
  }, [currentSession]);

  // Single combined check: resume context + onboarding gate
  const checkSessionContext = async () => {
    try {
      const [statusRes, prefsRes] = await Promise.all([
        chatApi.getContextStatus(),
        apiClient.getJobPreferences(),
      ]);

      const hasResume = statusRes?.data?.has_resume ?? false;
      const prefs = prefsRes?.data ?? prefsRes;
      const hasPrefs = !!(prefs?.desired_role);

      // Show resume loaded card if resume exists
      if (hasResume) {
        const resumeMsg = {
          role: 'assistant' as const,
          content: "i've loaded your resume.",
          timestamp: new Date(Date.now() - 1000).toISOString(),
          _type: 'resume_context',
        };
        setMessages((prev) => {
          if (prev.some((m) => (m as any)._type === 'resume_context')) return prev;
          return [resumeMsg as any, ...prev];
        });
      }

      // Only start onboarding if NO resume and NO preferences set
      if (!hasResume && !hasPrefs) {
        setOnboardingStep('name');
        setMessages([makeAIMessage(
          "hi, i'm Nova 👋\n\ni help you find the best next job. i scan thousands of roles daily to find the right one for you.\n\nso... what's your full name?"
        )]);
      }
    } catch {
      // Silently skip both checks on error
    }
  };

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

  // Handle onboarding step progression
  const handleOnboardingReply = async (input: string) => {
    const userMsg = makeAIMessage(input);
    userMsg.role = 'user';

    setMessages((prev) => [...prev, userMsg]);

    if (onboardingStep === 'name') {
      const name = input.trim();
      setOnboardingData((d) => ({ ...d, name }));
      setOnboardingStep('company');
      setTimeout(() => {
        setMessages((prev) => [...prev, makeAIMessage(
          `nice to meet you, ${name}! which company are you currently working at? (or type "no" if not employed)`
        )]);
      }, 400);
    } else if (onboardingStep === 'company') {
      setOnboardingData((d) => ({ ...d, company: input.trim() }));
      setOnboardingStep('role');
      setTimeout(() => {
        setMessages((prev) => [...prev, makeAIMessage('which role are you targeting next?')]);
      }, 400);
    } else if (onboardingStep === 'role') {
      setOnboardingData((d) => ({ ...d, role: input.trim() }));
      setOnboardingStep('city');
      setTimeout(() => {
        setMessages((prev) => [...prev, makeAIMessage('which city are you based in?')]);
      }, 400);
    } else if (onboardingStep === 'city') {
      const city = input.trim();
      setOnboardingData((d) => ({ ...d, city }));
      setOnboardingStep('mobility');
      setTimeout(() => {
        setMessages((prev) => [...prev, makeAIMessage(
          `open to relocating for the right opportunity, or staying in ${city}?`
        )]);
      }, 400);
    } else if (onboardingStep === 'mobility') {
      const mobility = input.trim();
      const data = { ...onboardingData, mobility };
      setOnboardingData(data);
      setOnboardingStep(null);

      // Save preferences
      try {
        await apiClient.updateJobPreferences({
          desired_role: data.role,
          preferred_location: data.city,
          work_type: mobility.toLowerCase().includes('open') || mobility.toLowerCase().includes('reloc') ? 'any' : 'onsite',
          preferred_sites: [],
        });
        // Also update name if available
        if (data.name) {
          const [firstName, ...rest] = data.name.split(' ');
          try {
            await apiClient.updateCurrentUser({ firstName, lastName: rest.join(' ') });
          } catch {}
        }
      } catch {
        // Don't block if save fails
      }

      // Done message + auto job search
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          makeAIMessage(`perfect. let me find the best **${data.role}** matches for you in **${data.city}**... 🔍`),
        ]);
        // Auto-trigger job search after a short delay
        setTimeout(() => {
          sendMessage(`find ${data.role} jobs in ${data.city}`);
        }, 800);
      }, 400);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // If in onboarding, intercept
    if (onboardingStep) {
      handleOnboardingReply(message);
      return;
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
        session_id: currentSession,
        message: message.trim(),
      };

      const response = await chatApi.sendMessage(request);

      if (response.success) {
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
        onSessionsChange();
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
      <div className="flex flex-1 flex-col min-w-0">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
