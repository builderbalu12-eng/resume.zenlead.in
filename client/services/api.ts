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
  has_payments?: boolean;
  is_admin?: boolean;
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

export interface CreditLogEntry {
  type: string;
  feature: string;
  display_name: string;
  amount: number;
  balance_after: number;
  description: string;
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

export class APIClient {
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
    let token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    let tokenSource = 'localStorage';

    if (!token && typeof chrome !== 'undefined' && chrome.storage) {
      // Try to get from chrome.storage.sync (for extension context)
      token = await new Promise<string | null>((resolve) => {
        chrome.storage.sync.get(['resumematch_auth_token', 'resumematch_token'], (result) => {
          const syncToken = result['resumematch_token'] || result['resumematch_auth_token'] || null;
          if (syncToken) {
            console.log('[API] ✓ Token retrieved from chrome.storage.sync');
          } else {
            console.warn('[API] ⚠️ chrome.storage.sync has no auth_token or token');
          }
          resolve(syncToken);
        });
      });
      if (token) {
        tokenSource = 'chrome.storage.sync';
      }
    } else if (token) {
      console.log('[API] Token retrieved from localStorage');
    } else {
      console.warn('[API] ⚠️ No auth token found in any storage');
    }

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log(`[API] Sending request to ${endpoint} with auth token from ${tokenSource}`);
    } else {
      console.warn(`[API] Sending request to ${endpoint} WITHOUT auth token`);
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
        errorData.detail || errorData.message || `Request failed (${response.status})`
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
    const response = await this.request('/api/user/me', {
      method: 'GET',
    });
    // Handle both new response format and raw user response
    return response.data?.user || response;
  }

  async updateCurrentUser(data: { firstName?: string; lastName?: string }): Promise<User> {
    const response = await this.request('/api/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    // Handle both new response format and raw user response
    return response.data?.user || response;
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<any> {
    return this.request('/api/user/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, new_password: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
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

  async getCreditsHistory(skip = 0, limit = 30): Promise<{ items: CreditLogEntry[]; total: number }> {
    const res = await this.request(`/api/user/me/credits/history?skip=${skip}&limit=${limit}`, { method: 'GET' });
    return res.data;
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

  // Telegram endpoints
  async getTelegramStatus(): Promise<{ linked: boolean }> {
    return this.request('/api/telegram/status', {
      method: 'GET',
    });
  }

  async getTelegramLink(): Promise<{ link: string }> {
    return this.request('/api/telegram/link', {
      method: 'GET',
    });
  }

  async getTelegramQR(): Promise<Blob> {
    const url = this.baseUrl ? `${this.baseUrl}/api/telegram/qr` : '/api/telegram/qr';
    let token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }

    return response.blob();
  }

  async disconnectTelegram(): Promise<any> {
    return this.request('/api/telegram/unlink', {
      method: 'DELETE',
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

  // Helper: Analyze job from HTML and tailor resume (combined single-call approach)
  async analyzeJobAndTailorResume(
    jobHtml: string,
    masterResume: any,
    configuredSections?: string[],
  ): Promise<{
    jobData: any;
    tailoredResume: any;
    atsScore: any;
    masterAtsScore: any;
    summary: string;
  }> {
    // Clean HTML in browser before sending — strip scripts/styles/tags, limit to 24k chars
    const cleanText = (jobHtml || '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 24000);

    // Single combined backend call — job extract + tailor + ATS score in one Gemini request
    const result = await this.request('/api/analyze-and-tailor', {
      method: 'POST',
      body: JSON.stringify({
        userCredits: 0,
        pageText: cleanText,
        resume: masterResume,
        configuredSections: configuredSections || [],
      }),
    });

    // Build JobDescription object from backend response
    const jobData = {
      title: result.jobTitle || 'Unknown Position',
      company: result.company || 'Unknown Company',
      location: result.location || '',
      description: result.jobDescription || '',
      requirements: result.requirements || [],
      skills: result.skills || [],
      extractedAt: new Date(),
    };

    // Apply tailored content — flexible experience matching (exact OR includes fallback)
    const tailoredResume = {
      ...masterResume,
      summary: result.tailoredSummary || masterResume.summary,
      experience: (masterResume.experience || []).map((exp: any) => {
        const t = (result.tailoredExperience || []).find(
          (te: any) =>
            te.position?.toLowerCase() === exp.title?.toLowerCase() ||
            te.position?.toLowerCase().includes(exp.title?.toLowerCase()),
        );
        return t?.newBullets?.length > 0
          ? { ...exp, description: t.newBullets }
          : exp;
      }),
      projects: (masterResume.projects || []).map((proj: any) => {
        const t = (result.tailoredProjects || []).find(
          (tp: any) => tp.title?.toLowerCase() === proj.title?.toLowerCase(),
        );
        return t?.newDescription?.trim()
          ? { ...proj, description: t.newDescription }
          : proj;
      }),
      skills: result.tailoredSkillsOrder?.filter((s: string) =>
        (masterResume.skills || []).some(
          (ms: string) => ms.toLowerCase() === s.toLowerCase(),
        ),
      ) || masterResume.skills,
      ...(result.customSections && Object.keys(result.customSections).length > 0
        ? { customSections: result.customSections }
        : {}),
    };

    // Tailored ATS score from backend (Gemini-calculated against actual tailored content)
    const atsScore = {
      score: Math.min(100, Math.max(0, result.atsScore || 0)),
      matchPercentage: Math.min(100, Math.max(0, result.matchPercentage || 0)),
      keywordMatches: (result.matchedKeywords || []).filter(Boolean),
      missingKeywords: (result.missingKeywords || []).filter(Boolean),
      improvements: (result.improvements || []).filter(Boolean),
    };

    // Master ATS calculated LOCALLY — no extra API call (mirrors main branch approach)
    const masterAtsScore = calculateATSScoreLocal(masterResume, jobData);

    return {
      jobData,
      tailoredResume,
      atsScore,
      masterAtsScore,
      summary: result.jobSummary || `Match: ${result.atsScore}% for ${result.jobTitle}`,
    };
  }

  // ── Application History ──

  async saveApplication(record: {
    jobTitle: string;
    company: string;
    location: string;
    jobUrl: string;
    atsScoreBefore: number;
    atsScoreAfter: number;
    matchPercentage: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    status: string;
    pipelineStage?: string;
    notes?: string;
    followUpDate?: string;
    evaluationGrade?: string;
    compensationNotes?: string;
  }): Promise<any> {
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async getApplicationHistory(): Promise<any[]> {
    const res = await this.request('/api/applications', { method: 'GET' });
    return res.applications || [];
  }

  async evaluateJob(params: {
    jobUrl: string;
    jobTitle: string;
    company: string;
    description: string;
    userResumeId?: string;
  }): Promise<{ data: any }> {
    return this.request('/api/jobs/evaluate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async patchApplication(
    appId: string,
    data: {
      pipelineStage?: string;
      notes?: string;
      followUpDate?: string | null;
      evaluationGrade?: string;
      compensationNotes?: string;
    }
  ): Promise<any> {
    return this.request(`/api/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getApplicationStats(): Promise<{
    totalApplications: number;
    stageBreakdown: Record<string, number>;
    avgAtsScoreByStage: Record<string, number | null>;
  }> {
    return this.request('/api/applications/stats', { method: 'GET' });
  }

  async deleteApplication(appId: string): Promise<any> {
    return this.request(`/api/applications/${appId}`, { method: 'DELETE' });
  }

  async getJobPreferences(): Promise<any> {
    return this.request('/api/user/me/job-preferences', { method: 'GET' });
  }

  async updateJobPreferences(prefs: {
    desired_role: string;
    preferred_location: string;
    work_type: string;
    preferred_sites: string[];
  }): Promise<any> {
    return this.request('/api/user/me/job-preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
  }
}

// ── Local ATS calculator (no API call — mirrors main branch calculateATSScore) ──

function expandKeywordVariations(keyword: string): string[] {
  const lower = keyword.toLowerCase().trim();
  const variations = new Set<string>([lower]);
  variations.add(lower.replace(/[#+.\-]/g, ''));
  variations.add(lower.replace(/[.\-]/g, ' '));
  const abbrevMap: Record<string, string[]> = {
    'c++': ['cpp', 'c plus plus'],
    'c#': ['csharp', 'c sharp'],
    'node.js': ['nodejs', 'node'],
    'react.js': ['reactjs', 'react'],
    '.net': ['dot net', 'dotnet'],
  };
  for (const [abbrev, expansions] of Object.entries(abbrevMap)) {
    if (lower.includes(abbrev)) expansions.forEach((e) => variations.add(e));
  }
  if (lower.includes('javascript')) variations.add('js');
  if (lower.includes('typescript')) variations.add('ts');
  return Array.from(variations);
}

function calculateATSScoreLocal(resume: any, jobDescription: any): { score: number; matchPercentage: number; keywordMatches: string[]; missingKeywords: string[]; improvements: string[] } {
  const resumeText = [
    resume.summary || '',
    (resume.skills || []).join(' '),
    ...(resume.experience || []).map((e: any) => `${e.title} ${e.company} ${(e.description || []).join(' ')}`),
    ...(resume.education || []).map((e: any) => `${e.degree} ${e.field}`),
    ...(resume.projects || []).map((p: any) => `${p.title} ${p.description} ${(p.technologies || []).join(' ')}`),
    ...Object.values(resume.customSections || {}),
  ].join(' ').toLowerCase();

  const jobKeywords = [...(jobDescription.skills || []), ...(jobDescription.requirements || [])];
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of jobKeywords) {
    const found = expandKeywordVariations(kw).some((v) => resumeText.includes(v));
    (found ? matched : missing).push(kw);
  }

  const kwPct = jobKeywords.length > 0 ? (matched.length / jobKeywords.length) * 100 : 50;
  const kwScore = Math.min(40, (kwPct / 100) * 40);

  const skills = resume.skills || [];
  const skillsScore = skills.length >= 8 ? 10 : skills.length >= 5 ? 7 : skills.length > 0 ? 4 : 0;

  let expScore = 0;
  const experience = resume.experience || [];
  if (experience.length > 0) {
    expScore += experience.length >= 3 ? 10 : 5;
    const totalBullets = experience.reduce((n: number, e: any) => n + (e.description?.length || 0), 0);
    expScore += totalBullets >= 12 ? 15 : totalBullets >= 8 ? 12 : totalBullets >= 3 ? 8 : 0;
    expScore = Math.min(25, expScore);
  }

  const eduScore = (resume.education || []).length > 0 ? 10 : 0;
  const summaryLen = (resume.summary || '').trim().length;
  const summaryScore = summaryLen >= 100 ? 10 : summaryLen >= 50 ? 5 : 0;
  const projectsScore = Math.min(5, (resume.projects?.length || 0) * 2);

  const total = Math.min(100, Math.round(kwScore + skillsScore + expScore + eduScore + summaryScore + projectsScore));
  return {
    score: Math.max(20, total),
    matchPercentage: Math.round(kwPct),
    keywordMatches: matched,
    missingKeywords: missing,
    improvements: missing.length > 0 ? [`Add missing skills: ${missing.slice(0, 3).join(', ')}`] : [],
  };
}

export const apiClient = new APIClient(API_BASE_URL);
