// API client for ResumeMatch Pro backend

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

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

export interface SubscriptionPlan {
  _id: string;
  plan_name: string;
  amount: number;
  currency: string;
  period: string;
  interval: number;
  credits_per_cycle: number;
  description: string;
  is_active: boolean;
  razorpay_plan_id: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  _id: string;
  user_id: string;
  plan_id: string;
  razorpay_subscription_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentLog {
  _id: string;
  user_id: string;
  transaction_id?: string;
  amount_paid: number;
  currency: string;
  credits_added: number;
  status: string;
  created_at: string;
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
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;

    // Try to get token from localStorage first, then chrome.storage.sync
    let token = localStorage.getItem('auth_token');

    if (!token && typeof chrome !== 'undefined' && chrome.storage) {
      // Try to get from chrome.storage.sync (for extension context)
      token = await new Promise<string | null>((resolve) => {
        chrome.storage.sync.get(['resumematch_auth_token'], (result) => {
          resolve(result['resumematch_auth_token'] || null);
        });
      });
    }

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch {
      throw new Error('Unable to reach payment server. Please try again.');
    }

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

  async getIncomingResume(): Promise<any> {
    return this.request('/api/incoming-resume', {
      method: 'GET',
    });
  }

  async tailorResumeOld(resumeId: string, jobDescription: string): Promise<any> {
    return this.request(`/api/resume/${resumeId}/tailor`, {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    });
  }

  // Payment endpoints
  async getSubscriptionPlans(skip: number = 0, limit: number = 20, activeOnly: boolean = true): Promise<any> {
    return this.request(`/api/payments/subscription-plans?skip=${skip}&limit=${limit}&active_only=${activeOnly}`, {
      method: 'GET',
    });
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    return this.request(`/api/payments/subscription-plans/${planId}`, {
      method: 'GET',
    });
  }

  async createSubscription(planId: string, userId?: string): Promise<any> {
    const payload: Record<string, string> = {
      plan_id: planId,
    };

    if (userId) {
      payload.user_id = userId;
    }

    return this.request('/api/payments/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSubscriptions(skip: number = 0, limit: number = 20): Promise<any> {
    return this.request(`/api/payments/subscriptions?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request(`/api/payments/subscriptions/${subscriptionId}`, {
      method: 'GET',
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/api/payments/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  async createPaymentOrder(amount: number, currency: string, creditsToAdd: number, receipt?: string, userId?: string): Promise<any> {
    return this.request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency,
        credits_to_add: creditsToAdd,
        receipt: receipt || `receipt_${Date.now()}`,
        user_id: userId,
      }),
    });
  }

  async verifyPayment(razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string): Promise<any> {
    return this.request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
      }),
    });
  }

  async getPaymentLogs(skip: number = 0, limit: number = 20): Promise<any> {
    return this.request(`/api/payments/logs?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
  }

  async applyCoupon(code: string, amount: number, planId?: string): Promise<any> {
    return this.request('/api/payments/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({
        code,
        amount,
        plan_id: planId,
      }),
    });
  }

  // ============ GEMINI API ENDPOINTS ============

  async analyzeResume(resume: string, jobDescription: string): Promise<any> {
    return this.request('/api/analyze-resume', {
      method: 'POST',
      body: JSON.stringify({
        resume,
        jobDescription,
        userCredits: 0, // Backend will check actual credits
      }),
    });
  }

  async extractResume(documentText: string): Promise<any> {
    return this.request('/api/extract-resume', {
      method: 'POST',
      body: JSON.stringify({
        documentText,
        userCredits: 0,
      }),
    });
  }

  async tailorResume(resume: string, jobDescription: string): Promise<any> {
    return this.request('/api/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({
        resume,
        jobDescription,
        userCredits: 0,
      }),
    });
  }

  async getATSScore(resume: string, jobDescription: string): Promise<any> {
    return this.request('/api/ats-score', {
      method: 'POST',
      body: JSON.stringify({
        resume,
        jobDescription,
        userCredits: 0,
      }),
    });
  }

  async parseJob(jobDescription: string): Promise<any> {
    return this.request('/api/parse-job', {
      method: 'POST',
      body: JSON.stringify({
        jobDescription,
        userCredits: 0,
      }),
    });
  }

  async generateCoverLetter(resume: string, jobDescription: string): Promise<any> {
    return this.request('/api/generate-cover-letter', {
      method: 'POST',
      body: JSON.stringify({
        resume,
        jobDescription,
        userCredits: 0,
      }),
    });
  }

  async checkCompleteness(resume: string): Promise<any> {
    return this.request('/api/check-completeness', {
      method: 'POST',
      body: JSON.stringify({
        resume,
        userCredits: 0,
      }),
    });
  }

  // Helper: Analyze job from HTML and tailor resume (composite operation for extension)
  async analyzeJobAndTailorResume(
    jobHtml: string,
    masterResume: any,
    configuredSections?: string[],
  ): Promise<{
    jobData: any;
    tailoredResume: any;
    atsScore: any;
    masterAtsScore: any;
  }> {
    const resumeText = JSON.stringify(masterResume);

    // Extract job details from HTML text (basic extraction)
    const jobDescription = this.extractJobFromHtml(jobHtml);

    // Call backend APIs in parallel
    const [tailorResult, atsResult, masterAtsResult] = await Promise.all([
      this.tailorResume(resumeText, jobDescription),
      this.getATSScore(resumeText, jobDescription),
      this.getATSScore(resumeText, ""), // Empty job description for baseline
    ]);

    return {
      jobData: {
        title: "Job Title", // Will be extracted from HTML
        company: "Company", // Will be extracted from HTML
        description: jobDescription,
      },
      tailoredResume: masterResume, // Backend will return tailored content
      atsScore: {
        score: atsResult.atsScore || 0,
        matchPercentage: atsResult.atsScore || 0,
        keywordMatches: atsResult.topMissingKeywords || [],
      },
      masterAtsScore: {
        score: masterAtsResult.atsScore || 0,
      },
    };
  }

  private extractJobFromHtml(html: string): string {
    // Basic extraction - just return the HTML as-is for now
    // Backend will handle parsing it into structured data
    return html;
  }
}

export const apiClient = new APIClient(API_BASE_URL);
