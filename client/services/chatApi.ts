import {
  ApiResponse,
  ChatResponse,
  ChatSession,
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
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
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

  async getAllSessions(): Promise<ApiResponse<ChatSessionsResponse>> {
    const url = `${CHAT_BASE}/sessions`;
    console.log('[ChatApi] GET', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      console.log('[ChatApi] Response status:', response.status);
      return this.handleResponse<ChatSessionsResponse>(response);
    } catch (error) {
      console.error('[ChatApi] Fetch error:', error);
      throw error;
    }
  }
}

export const chatApi = new ChatApiService();
