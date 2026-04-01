import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatSession } from '@/types/chat';
import {
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  MoreVertical,
  Edit3,
  Briefcase,
  Building2,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSession: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  disabled?: boolean;
}

// Generate a session name from the preview text
function getSessionName(session: ChatSession): string {
  if (session.preview && session.preview.trim()) {
    const cleanPreview = session.preview
      .replace(/^[^a-zA-Z]*/, '')
      .trim();
    if (cleanPreview) {
      return cleanPreview.slice(0, 30) + (cleanPreview.length > 30 ? '...' : '');
    }
  }
  return 'New Chat';
}

// Get icon based on session preview content
function getSessionIcon(preview: string) {
  const lower = preview.toLowerCase();
  if (lower.includes('job') || lower.includes('work') || lower.includes('hire')) {
    return <Briefcase className="h-3.5 w-3.5" />;
  }
  if (lower.includes('business') || lower.includes('client') || lower.includes('lead')) {
    return <Building2 className="h-3.5 w-3.5" />;
  }
  if (lower.includes('resume') || lower.includes('cv')) {
    return <FileText className="h-3.5 w-3.5" />;
  }
  return <MessageSquare className="h-3.5 w-3.5" />;
}

export function ChatSidebar({
  sessions,
  currentSession,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  disabled,
}: ChatSidebarProps) {
  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [sessions]);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/20">
      {/* Header */}
      <div className="p-3">
        <Button
          onClick={onNewSession}
          disabled={disabled}
          className="w-full gap-2 rounded-xl bg-background border border-muted-foreground/20 hover:bg-muted text-foreground"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Recents Section */}
      <div className="flex-1 px-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Recents
        </p>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-0.5">
            {sortedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">No chats yet</p>
              </div>
            ) : (
              sortedSessions.map((session) => {
                const isActive = session.session_id === currentSession;
                const sessionName = getSessionName(session);

                return (
                  <div
                    key={session.session_id}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-2 py-2 transition-all cursor-pointer',
                      isActive
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => onSessionSelect(session.session_id)}
                  >
                    <span className={cn(
                      'text-muted-foreground shrink-0',
                      isActive && 'text-foreground'
                    )}>
                      {getSessionIcon(session.preview || '')}
                    </span>

                    <p
                      className={cn(
                        'text-sm truncate flex-1',
                        isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {sessionName}
                    </p>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.session_id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer - could add user profile here */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-[10px] text-white font-medium">
            U
          </div>
          <span className="text-sm text-muted-foreground">User</span>
        </div>
      </div>
    </div>
  );
}
