export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyWorking?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  date?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects?: Project[];
  certifications?: string[];
}

export interface JobDescription {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  skills: string[];
  url?: string;
  extractedAt?: Date;
}

export interface ApplicationRecord {
  _id?: string;
  userId: string;
  jobTitle: string;
  company: string;
  jobUrl?: string;
  jobDescription: JobDescription;
  originalResume: ResumeData;
  tailoredResume: ResumeData;
  atsScore: number;
  matchPercentage: number;
  appliedDate: Date;
  status: "applied" | "interview" | "rejected" | "offer";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id?: string;
  email: string;
  masterResume?: ResumeData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DemoResponse {
  message: string;
}

// ============ PAYMENT TYPES ============

export interface SubscriptionPlan {
  _id?: string;
  plan_name: string;
  amount: number;
  currency: string;
  period: "daily" | "monthly" | "yearly";
  interval: number;
  credits_per_cycle: number;
  description: string;
  is_active: boolean;
  applicable_to: string[];
  razorpay_plan_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subscription {
  _id?: string;
  user_id: string;
  plan_id: string;
  razorpay_subscription_id?: string;
  status: "active" | "paused" | "cancelled" | "pending";
  current_period_start?: Date;
  current_period_end?: Date;
  pause_until?: Date;
  cancelled_at?: Date;
  next_billing_date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentLog {
  _id?: string;
  user_id: string;
  transaction_id: string;
  order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount_paid: number;
  currency: string;
  credits_added: number;
  status: "success" | "failed" | "pending";
  payment_method?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Coupon {
  _id?: string;
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  max_uses: number;
  uses_count?: number;
  expires_at: Date;
  is_active: boolean;
  applicable_to_plans: string[];
  applicable_to_domains: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePlanRequest {
  plan_name: string;
  amount: number;
  currency: string;
  period: "daily" | "monthly" | "yearly";
  interval: number;
  credits_per_cycle: number;
  description: string;
  is_active: boolean;
  applicable_to: string[];
}

export interface UpdatePlanRequest {
  plan_name?: string;
  amount?: number;
  currency?: string;
  period?: string;
  interval?: number;
  credits_per_cycle?: number;
  description?: string;
  is_active?: boolean;
  applicable_to?: string[];
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  user_id: string;
}

export interface UpdateSubscriptionRequest {
  status?: string;
  pause_until?: Date;
}

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  credits_to_add: number;
  receipt: string;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateCouponRequest {
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  max_uses: number;
  expires_at: Date;
  is_active: boolean;
  applicable_to_plans: string[];
  applicable_to_domains: string[];
}

export interface UpdateCouponRequest {
  discount_percent?: number;
  discount_amount?: number;
  max_uses?: number;
  expires_at?: Date;
  is_active?: boolean;
  applicable_to_plans?: string[];
  applicable_to_domains?: string[];
}
