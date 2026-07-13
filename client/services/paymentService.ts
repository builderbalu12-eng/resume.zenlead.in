const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
    : "http://localhost:8000/api")
).replace(/\/$/, "");

function getAccessToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token")
  );
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("Network error. Please try again.");
  }

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized. Redirecting to login…");
  }

  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      res.statusText;
    throw new Error(detail || "Request failed");
  }

  return data as T;
}

export type BillingCycle = "monthly" | "yearly";

export type SubscriptionPlan = {
  _id: string;
  plan_name: string;
  amount: number;
  currency: string;
  is_recurring: boolean;
  billing_cycle: BillingCycle;
  credits_per_cycle: number;
  points: string[];
  description: string;
  razorpay_plan_id: string;
  is_active: boolean;
};

export type GetPlansResponse = {
  status: number;
  data: { items: SubscriptionPlan[] };
};

export type CouponValidationResponse = {
  status: number;
  data: {
    code: string;
    original_amount: number;
    discount: number;
    discounted_amount: number;
    currency: string;
  };
};

export type CreateSubscriptionResponse = {
  status: number;
  data: {
    subscription_id: string;
    payment_session_id: string | null;  // null for free plans
    cashfree_order_id: string | null;
    plan_name: string;
    amount: number;
    billing_cycle: BillingCycle;
    renewal_date: string;
  };
};

export type CreateOrderResponse = {
  status: number;
  data: {
    payment_session_id: string;
    cashfree_order_id: string;
    amount: number;
    currency: string;
    plan_name: string;
    description: string;
    coupon_id: string | null;
  };
};

export type VerifyPaymentResponse = {
  status: number;
  data: { plan_name: string; amount_paid: number; renewal_date: string };
};

export type BillingHistoryItem = {
  _id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_status: "succeeded" | "failed" | string;
  payment_provider: "razorpay" | string;
  payment_id: string;
  invoice_url: string | null;
  is_recurring: boolean;
  payment_date: string;
  renewal_date?: string;
};

export type BillingHistoryResponse = {
  status: number;
  data: { items: BillingHistoryItem[]; total: number };
};

export type SubscriptionItem = {
  _id: string;
  plan_name: string;
  status: "active" | "paused" | "cancelled" | string;
  billing_cycle: BillingCycle;
  amount_paid: number;
  currency: string;
  renewal_date: string;
};

export type SubscriptionsResponse = {
  data: { items: SubscriptionItem[] };
};

export const paymentService = {
  getPlans(): Promise<GetPlansResponse> {
    return request("/payments/subscription-plans", { method: "GET" });
  },

  validateCoupon(code: string, planId: string): Promise<CouponValidationResponse> {
    return request("/payments/coupons/validate", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ code, plan_id: planId }),
    });
  },

  createSubscription(input: {
    plan_id: string;
    billing_cycle: BillingCycle;
    is_recurring: true;
    coupon_code?: string;
    customer_phone?: string;
  }): Promise<CreateSubscriptionResponse> {
    return request("/payments/subscriptions", {
      method: "POST",
      auth: true,
      body: JSON.stringify(input),
    });
  },

  createOrder(input: {
    plan_id: string;
    billing_cycle: BillingCycle;
    is_recurring: false;
    coupon_code?: string;
    customer_phone?: string;
  }): Promise<CreateOrderResponse> {
    return request("/payments/create-order", {
      method: "POST",
      auth: true,
      body: JSON.stringify(input),
    });
  },

  verifyPayment(input: { cashfree_order_id: string }): Promise<VerifyPaymentResponse> {
    return request("/payments/verify", {
      method: "POST",
      auth: true,
      body: JSON.stringify(input),
    });
  },

  getBillingHistory(): Promise<BillingHistoryResponse> {
    return request("/payments/billing-history", { method: "GET", auth: true });
  },

  getSubscriptions(): Promise<SubscriptionsResponse> {
    return request("/payments/subscriptions", { method: "GET", auth: true });
  },

  cancelSubscription(subscriptionId: string): Promise<{ status: number; message: string }> {
    return request(`/payments/subscriptions/${subscriptionId}`, { method: "DELETE", auth: true });
  },

  refreshMe(): Promise<any> {
    return request("/user/me", { method: "GET", auth: true });
  },
};

