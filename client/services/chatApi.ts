import {
  ApiResponse,
  ChatResponse,
  ChatHistoryResponse,
  ChatSessionsResponse,
  NewSessionResponse,
  DeleteSessionResponse,
  SendMessageRequest,
} from '@/types/chat';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CHAT_BASE = `${API_BASE}/api/chat`;

class ChatApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token') ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      window.location.href = '/login?redirect=/chat';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(
    request: SendMessageRequest
  ): Promise<ApiResponse<ChatResponse>> {
    const response = await fetch(`${CHAT_BASE}/message`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<ChatResponse>(response);
  }

  async getHistory(sessionId: string): Promise<ApiResponse<ChatHistoryResponse>> {
    const response = await fetch(`${CHAT_BASE}/history?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ChatHistoryResponse>(response);
  }

  async createSession(): Promise<ApiResponse<NewSessionResponse>> {
    const response = await fetch(`${CHAT_BASE}/session/new`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({}),
    });
    return this.handleResponse<NewSessionResponse>(response);
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<DeleteSessionResponse>> {
    const response = await fetch(`${CHAT_BASE}/session/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<DeleteSessionResponse>(response);
  }

  async cleanupEmptySessions(): Promise<void> {
    const response = await fetch(`${CHAT_BASE}/sessions/empty`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse(response);
  }

  async getAllSessions(): Promise<ApiResponse<ChatSessionsResponse>> {
    const response = await fetch(`${CHAT_BASE}/sessions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ChatSessionsResponse>(response);
  }

  async getContextStatus(): Promise<ApiResponse<{ has_resume: boolean; job_prefs_set: boolean }>> {
    const response = await fetch(`${CHAT_BASE}/context-status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async *sendMessageStream(
    request: SendMessageRequest
  ): AsyncGenerator<any, void, unknown> {
    const token = localStorage.getItem('access_token') ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('auth_token');
    const response = await fetch(`${CHAT_BASE}/message/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login?redirect=/chat';
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            yield JSON.parse(line.slice(6));
          } catch {
            // skip malformed lines
          }
        }
      }
    }
  }

  async saveJobInterest(data: {
    job_title: string;
    company: string;
    job_url: string;
    location: string;
  }): Promise<ApiResponse<{ application_id: string }>> {
    const response = await fetch(`${CHAT_BASE}/job-interest`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }
}

export const chatApi = new ChatApiService();
