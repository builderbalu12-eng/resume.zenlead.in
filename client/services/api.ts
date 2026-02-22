// API client for ResumeMatch Pro backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AuthResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    token_type: string;
  };
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  credits: number;
  auth_provider: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.statusText}`
      );
    }

    return response.json();
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/api/user/me', {
      method: 'GET',
    });
  }

  async getGoogleAuthUrl(): Promise<{ success: boolean; auth_url: string }> {
    return this.request('/api/auth/google/url', {
      method: 'GET',
    });
  }

  // User endpoints
  async updateUser(userId: string, data: Partial<User>): Promise<any> {
    return this.request(`/api/user/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getUserCredits(userId: string): Promise<{ credits: number }> {
    return this.request(`/api/user/${userId}/credits`, {
      method: 'GET',
    });
  }

  // Resume endpoints (placeholder for future implementation)
  async uploadResume(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/resume/upload`;
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload resume: ${response.statusText}`);
    }

    return response.json();
  }

  async getResumes(): Promise<any[]> {
    return this.request('/api/resume/list', {
      method: 'GET',
    });
  }

  async tailorResume(resumeId: string, jobDescription: string): Promise<any> {
    return this.request(`/api/resume/${resumeId}/tailor`, {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    });
  }
}

export const apiClient = new APIClient(API_BASE_URL);
