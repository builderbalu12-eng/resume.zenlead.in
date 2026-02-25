import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/resumematch-pro";

let connected = false;

export async function connectDB() {
  if (connected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    connected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// ============ SCHEMAS ============

const subscriptionPlanSchema = new mongoose.Schema(
  {
    plan_name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    period: {
      type: String,
      enum: ["daily", "monthly", "yearly"],
      required: true,
    },
    interval: {
      type: Number,
      default: 1,
    },
    credits_per_cycle: {
      type: Number,
      required: true,
    },
    description: String,
    is_active: {
      type: Boolean,
      default: true,
    },
    applicable_to: [String],
    razorpay_plan_id: String,
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    razorpay_subscription_id: String,
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "pending"],
      default: "active",
    },
    current_period_start: Date,
    current_period_end: Date,
    pause_until: Date,
    cancelled_at: Date,
    next_billing_date: Date,
  },
  { timestamps: true }
);

const paymentLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    order_id: {
      type: String,
      required: true,
    },
    razorpay_payment_id: String,
    razorpay_signature: String,
    amount_paid: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    credits_added: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
    },
    payment_method: String,
    description: String,
  },
  { timestamps: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discount_percent: Number,
    discount_amount: Number,
    max_uses: {
      type: Number,
      required: true,
    },
    uses_count: {
      type: Number,
      default: 0,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    applicable_to_plans: [String],
    applicable_to_domains: [String],
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    _id: String, // Will be set to user ID
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    credits: {
      type: Number,
      default: 0,
    },
    masterResume: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true, _id: false }
);

// ============ MODELS ============

export const User = mongoose.model("User", userSchema);
export const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
export const PaymentLog = mongoose.model("PaymentLog", paymentLogSchema);
export const Coupon = mongoose.model("Coupon", couponSchema);
