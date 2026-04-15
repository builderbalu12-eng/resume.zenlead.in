const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
    : "http://localhost:8000/api")
).replace(/\/$/, "");

function getToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token")
  );
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("Network error. Please try again.");
  }

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

// ── Analytics ─────────────────────────────────────────────

export type AnalyticsTrendPoint = {
  label: string;
  sessions: number;
  users: number;
  pageviews: number;
};

export type AnalyticsPage = {
  page: string;
  views: number;
  sessions: number;
  users: number;
};

export type AnalyticsData = {
  realtime_users: number;
  summary: {
    sessions: number;
    users: number;
    pageviews: number;
    bounce_rate: number;
    avg_session_duration: number;
    new_users: number;
  };
  trend: AnalyticsTrendPoint[];
  top_pages: AnalyticsPage[];
  new_vs_returning: { type: string; sessions: number; users: number }[];
  devices: { device: string; sessions: number }[];
};

export type AnalyticsOverview = AnalyticsData; // alias kept for backwards compat

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d";

export async function getAdminAnalytics(period: AnalyticsPeriod = "today"): Promise<AnalyticsData> {
  const res = await request<{ data: AnalyticsData }>(`/admin/analytics?period=${period}`);
  return res.data;
}

// ── Stats ──────────────────────────────────────────────────

export type AdminStats = {
  total_users: number;
  total_credits_in_system: number;
  active_coupons: number;
  total_features: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const res = await request<{ data: AdminStats }>("/admin/stats");
  return res.data;
}

// ── Users ──────────────────────────────────────────────────

export type AdminUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  credits: number;
  created_at: string;
  auth_provider: string;
};

export async function listAdminUsers(skip = 0, limit = 50): Promise<{ items: AdminUser[]; total: number }> {
  const res = await request<{ data: { items: AdminUser[]; total: number } }>(`/admin/users?skip=${skip}&limit=${limit}`);
  return res.data;
}

export async function adjustUserCredits(userId: string, amount: number, reason: string): Promise<void> {
  await request(`/admin/users/${userId}/credits`, {
    method: "PATCH",
    body: JSON.stringify({ amount, reason }),
  });
}

// ── Feature Costs ─────────────────────────────────────────

export type FeatureCost = {
  _id: string;
  feature: string;
  display_name: string;
  credits_per_unit: number;
  unit: string;
  description: string;
  is_active: boolean;
};

export async function listFeatureCosts(): Promise<FeatureCost[]> {
  const res = await request<{ data: FeatureCost[] }>("/admin/feature-costs");
  return res.data;
}

export async function updateFeatureCost(featureName: string, credits_per_unit: number): Promise<void> {
  await request(`/admin/feature-costs/${featureName}`, {
    method: "PATCH",
    body: JSON.stringify({ credits_per_unit }),
  });
}

// ── Coupons ───────────────────────────────────────────────

export type AdminCoupon = {
  _id: string;
  code: string;
  coupon_type: string;
  applicable_to_user_id?: string;
  applicable_to_domains?: string[];
  discount_percent?: number;
  discount_amount?: number;
  applicable_to_plans?: string[];
  max_uses?: number;
  uses_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
};

export type CreateCouponData = {
  code: string;
  coupon_type: "individual" | "domain" | "public";
  applicable_to_email?: string;      // backend resolves email → user_id
  applicable_to_domains?: string[];
  discount_percent?: number;
  discount_amount?: number;
  applicable_to_plans?: string[];
  max_uses?: number;
  expires_at?: string;
  is_active?: boolean;
};

export type CouponUsageEntry = {
  coupon_code: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: string;
  discount_applied: number;
  payment_type: "order" | "subscription";
  created_at: string;
};

export async function listAdminCoupons(activeOnly = false): Promise<{ items: AdminCoupon[]; total: number }> {
  const res = await request<{ data: { items: AdminCoupon[]; total: number } }>(`/admin/coupons?active_only=${activeOnly}`);
  return res.data;
}

export async function createAdminCoupon(data: CreateCouponData): Promise<void> {
  await request("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminCoupon(couponId: string): Promise<void> {
  await request(`/admin/coupons/${couponId}`, { method: "DELETE" });
}

export async function getCouponUsage(couponId: string): Promise<CouponUsageEntry[]> {
  const res = await request<{ data: CouponUsageEntry[] }>(`/admin/coupons/${couponId}/usage`);
  return res.data;
}

// ── User Credits Log ──────────────────────────────────────

export type AdminCreditLogEntry = {
  type: string;
  feature: string;
  display_name: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
};

export async function getUserCreditsLog(userId: string): Promise<AdminCreditLogEntry[]> {
  const res = await request<{ data: AdminCreditLogEntry[] }>(`/admin/users/${userId}/credits-log`);
  return res.data;
}

// ── User Billing ──────────────────────────────────────────

export type AdminSubscription = {
  plan_id: string;
  plan_name: string;
  amount_paid: number;
  currency: string;
  billing_cycle: string;
  status: string;
  start_date?: string;
  renewal_date?: string;
  cancelled_at?: string;
  is_recurring: boolean;
};

export type AdminBillingEntry = {
  plan_name: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_date?: string;
  invoice_url?: string;
  is_recurring: boolean;
};

export type AdminUserBilling = {
  subscription: AdminSubscription | null;
  billing_history: AdminBillingEntry[];
};

export async function getUserBilling(userId: string): Promise<AdminUserBilling> {
  const res = await request<{ data: AdminUserBilling }>(`/admin/users/${userId}/billing`);
  return res.data;
}

// ── Resource Utilization ──────────────────────────────────

export type GeminiModel = {
  id: string;
  name: string;
  rpd: number;
  rpm: number;
};

export type GeminiResource = {
  api_key_masked: string;
  api_key_full: string;
  model: string;
  temperature: number;
  max_tokens: number;
  updated_at: string | null;
  updated_by: string | null;
  today_usage: number;
  daily_limit: number;
  rpm_limit: number;
  usage_history: { date: string; count: number }[];
};

export async function getGeminiResource(): Promise<GeminiResource> {
  const res = await request<{ data: GeminiResource }>("/admin/resources/gemini");
  return res.data;
}

export async function updateGeminiConfig(data: {
  api_key?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<void> {
  await request("/admin/resources/gemini", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function listGeminiModels(): Promise<GeminiModel[]> {
  const res = await request<{ data: GeminiModel[] }>("/admin/resources/models");
  return res.data;
}

export type MongoCollectionDetail = {
  name: string;
  count: number;
  size_bytes: number;
  storage_bytes: number;
  index_bytes: number;
};

export type MongoDBResource = {
  db_name: string;
  collections: number;
  objects: number;
  data_size_bytes: number;
  storage_size_bytes: number;
  index_size_bytes: number;
  free_tier_limit_bytes: number;
  collection_details: MongoCollectionDetail[];
};

export async function getMongoDBResource(): Promise<MongoDBResource> {
  const res = await request<{ data: MongoDBResource }>("/admin/resources/mongodb");
  return res.data;
}

export type JSearchResource = {
  api_key_masked: string;
  requests_limit: number;
  requests_remaining: number;
  calls_today: number;
  requests_reset: string | null;
  last_updated: string | null;
  usage_history: { date: string; calls: number }[];
};

export async function getJSearchResource(): Promise<JSearchResource> {
  const res = await request<{ data: JSearchResource }>("/admin/resources/jsearch");
  return res.data;
}

export type DailyFeedJob = {
  title: string;
  company: string;
  location: string;
  site: string;
  fit_score: number;
  job_url: string;
  is_remote: boolean | null;
  description_summary: string;
};

export type DailyFeedEntry = {
  user_email: string;
  search_term: string;
  location: string;
  total_jobs: number;
  site_breakdown: Record<string, number>;
  created_at: string;
  jobs: DailyFeedJob[];
};

export type DailyFeedData = {
  date: string;
  total: number;
  page: number;
  total_pages: number;
  entries: DailyFeedEntry[];
};

export async function getJSearchDailyFeed(date?: string, page = 1): Promise<DailyFeedData> {
  const params = new URLSearchParams({ page: String(page) });
  if (date) params.set("date", date);
  const res = await request<{ data: DailyFeedData }>(`/admin/resources/jsearch/daily-feed?${params}`);
  return res.data;
}
