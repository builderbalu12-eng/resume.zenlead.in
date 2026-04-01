import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatSession } from '@/types/chat';
import {
  Plus,
  Trash2,
  MessageSquare,
  MoreVertical,
  Briefcase,
  Building2,
  FileText,
  Sparkles,
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

function getSessionName(session: ChatSession): string {
  if (session.preview && session.preview.trim()) {
    const cleanPreview = session.preview.replace(/^[^a-zA-Z]*/, '').trim();
    if (cleanPreview) {
      return cleanPreview.slice(0, 32) + (cleanPreview.length > 32 ? '…' : '');
    }
  }
  return 'New Chat';
}

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
  const sortedSessions = React.useMemo(
    () => [...sessions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [sessions]
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground">Maya</span>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Button
          onClick={onNewSession}
          disabled={disabled}
          variant="ghost"
          className="w-full justify-start gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-hidden px-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">
          Recents
        </p>
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div className="space-y-px">
            {sortedSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No chats yet</p>
            ) : (
              sortedSessions.map((session) => {
                const isActive = session.session_id === currentSession;
                return (
                  <div
                    key={session.session_id}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors',
                      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                    onClick={() => onSessionSelect(session.session_id)}
                  >
                    <span className="shrink-0">
                      {getSessionIcon(session.preview || '')}
                    </span>
                    <p className={cn('text-xs truncate flex-1', isActive && 'font-medium text-foreground')}>
                      {getSessionName(session)}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive text-xs gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.session_id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete chat
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

      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[11px] text-white font-semibold shrink-0">
            U
          </div>
          <span className="text-xs text-muted-foreground truncate">My Account</span>
        </div>
      </div>
    </div>
  );
}
