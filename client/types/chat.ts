export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  timestamp: string;
}

export interface ChatSession {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
}

export interface SendMessageRequest {
  session_id?: string;
  message: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  intent: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  success: boolean;
  message: string;
  data: T;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  total_messages: number;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  total_sessions: number;
}

export interface NewSessionResponse {
  session_id: string;
  created_at: string;
}

export interface DeleteSessionResponse {
  session_id: string;
}

export interface QuickAction {
  icon: string;
  text: string;
  intent: string;
  query: string;
}
