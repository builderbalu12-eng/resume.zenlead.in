import * as React from 'react';
import { chatApi } from '@/services/chatApi';
import { ChatSession, ChatMessage } from '@/types/chat';
import { toast } from 'sonner';
import { 
  Plus, 
  History, 
  Settings, 
  Bell, 
  Send,
  User,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

// Quick actions for empty state
const quickActions = [
  { text: 'I am a freelancer', query: 'I am a freelancer looking for work' },
  { text: 'I am a client looking for freelancer', query: 'I need to hire a freelancer' },
  { text: 'Check on my active projects', query: 'Show my active projects' },
];

// Left sidebar icons
function ChatLeftSidebar({ 
  onNewChat, 
  onShowRecents,
  activeView 
}: { 
  onNewChat: () => void;
  onShowRecents: () => void;
  activeView: 'chat' | 'recents';
}) {
  return (
    <div className="flex flex-col h-full w-16 bg-muted/30 border-r">
      {/* Top icons */}
      <div className="flex flex-col items-center gap-2 p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className={cn(
            "h-10 w-10 rounded-xl transition-all",
            activeView === 'chat' ? "bg-primary/10 text-primary" : "hover:bg-muted"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowRecents}
          className={cn(
            "h-10 w-10 rounded-xl transition-all",
            activeView === 'recents' ? "bg-primary/10 text-primary" : "hover:bg-muted"
          )}
        >
          <History className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-2 p-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-muted"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-muted"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// Recents panel (shown when History icon clicked)
function RecentsPanel({ 
  sessions, 
  currentSession, 
  onSelect, 
  onDelete 
}: { 
  sessions: ChatSession[];
  currentSession: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="w-64 h-full border-r bg-muted/20 p-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Recents
      </h3>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="space-y-1">
          {sorted.map((session) => {
            const preview = session.preview?.slice(0, 30) || 'New Chat';
            const isActive = session.session_id === currentSession;
            return (
              <div
                key={session.session_id}
                onClick={() => onSelect(session.session_id)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm",
                  isActive ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="truncate flex-1">{preview}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.session_id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Maya Avatar component
function MayaAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
    </div>
  );
}

// Empty state with centered input
function EmptyState({ onSend }: { onSend: (msg: string) => void }) {
  const [input, setInput] = React.useState('');
  
  const handleSubmit = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-background via-background to-muted/20">
      {/* Greeting with avatar */}
      <div className="flex items-center gap-4 mb-8">
        <MayaAvatar />
        <div>
          <p className="text-muted-foreground italic text-lg">Hey There</p>
          <h1 className="text-3xl font-bold">How can I help you today?</h1>
        </div>
      </div>
      
      {/* Centered input */}
      <div className="w-full max-w-2xl mb-8">
        <div className="relative flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder='Try "I need a video editor for a 2-week project"'
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/60"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="flex flex-wrap justify-center gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.text}
            variant="outline"
            onClick={() => onSend(action.query)}
            className="h-auto py-2 px-4 rounded-full border-muted-foreground/20 hover:bg-muted/50"
          >
            <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
            {action.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Message bubble components
function UserMessage({ content, timestamp }: { content: string; timestamp: string }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="max-w-[80%]">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-2xl rounded-tr-sm">
          {content}
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

function AIMessage({ content, timestamp, intent }: { content: string; timestamp: string; intent?: string }) {
  return (
    <div className="flex items-start gap-3">
      <MayaAvatar className="shrink-0" />
      <div className="max-w-[80%]">
        <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 text-card-foreground">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {intent && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {intent}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Chat conversation view
function ChatConversation({ 
  messages, 
  isLoading, 
  onSend 
}: { 
  messages: ChatMessage[]; 
  isLoading: boolean;
  onSend: (msg: string) => void;
}) {
  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            msg.role === 'user' ? (
              <UserMessage 
                key={i} 
                content={msg.content} 
                timestamp={msg.timestamp} 
              />
            ) : (
              <AIMessage 
                key={i} 
                content={msg.content} 
                timestamp={msg.timestamp}
                intent={msg.intent}
              />
            )
          ))}
          {isLoading && (
            <div className="flex items-center gap-3">
              <MayaAvatar className="shrink-0 w-10 h-10" />
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input at bottom */}
      <div className="p-4 border-t bg-background">
        <div className="max-w-3xl mx-auto relative flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder='Type your message...'
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              input.trim() && !isLoading ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function ChatPage() {
  const [currentSession, setCurrentSession] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const [activeView, setActiveView] = React.useState<'chat' | 'recents'>('chat');

  // Load sessions on mount
  React.useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  React.useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  const loadSessions = async () => {
    try {
      const response = await chatApi.getAllSessions();
      if (response.success) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsReady(true);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await chatApi.getHistory(sessionId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatApi.createSession();
      if (response.success) {
        const newId = response.data.session_id;
        setCurrentSession(newId);
        setMessages([]);
        setActiveView('chat');
        await loadSessions();
        toast.success('New chat created');
      }
    } catch (error) {
      toast.error('Failed to create chat');
    }
  };

  const handleSendMessage = async (message: string) => {
    let sessionId = currentSession;
    
    // Create session if needed
    if (!sessionId) {
      try {
        const response = await chatApi.createSession();
        if (response.success) {
          sessionId = response.data.session_id;
          setCurrentSession(sessionId);
          await loadSessions();
        }
      } catch (error) {
        toast.error('Failed to create session');
        return;
      }
    }

    // Add user message immediately
    const userMsg: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage({
        session_id: sessionId!,
        message,
      });
      
      if (response.success) {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: response.data.timestamp,
          intent: response.data.intent,
        };
        setMessages(prev => [...prev, aiMsg]);
        loadSessions(); // Refresh to update preview
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId);
      toast.success('Chat deleted');
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-6 md:-my-8">
      {/* Icon-only sidebar */}
      <ChatLeftSidebar 
        onNewChat={createNewSession}
        onShowRecents={() => setActiveView(activeView === 'recents' ? 'chat' : 'recents')}
        activeView={activeView}
      />

      {/* Recents panel (only when history clicked) */}
      {activeView === 'recents' && (
        <RecentsPanel
          sessions={sessions}
          currentSession={currentSession}
          onSelect={(id) => {
            setCurrentSession(id);
            setActiveView('chat');
          }}
          onDelete={handleDeleteSession}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {hasMessages ? (
          <ChatConversation 
            messages={messages} 
            isLoading={isLoading}
            onSend={handleSendMessage}
          />
        ) : (
          <EmptyState onSend={handleSendMessage} />
        )}
      </div>
    </div>
  );
}
