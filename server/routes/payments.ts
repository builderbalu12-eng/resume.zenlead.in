import { RequestHandler } from "express";
import Razorpay from "razorpay";
import { createHmac } from "crypto";
import {
  SubscriptionPlan,
  Subscription,
  PaymentLog,
  Coupon,
} from "../db";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ============ SUBSCRIPTION PLANS ENDPOINTS ============

export const createPlan: RequestHandler = async (req, res) => {
  try {
    const {
      plan_name,
      amount,
      currency,
      period,
      interval,
      credits_per_cycle,
      description,
      is_active,
      applicable_to,
    } = req.body;

    const plan = new SubscriptionPlan({
      plan_name,
      amount,
      currency,
      period,
      interval,
      credits_per_cycle,
      description,
      is_active,
      applicable_to,
    });

    const savedPlan = await plan.save();
    res.status(201).json(savedPlan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listPlans: RequestHandler = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const activeOnly = req.query.active_only !== "false";

    const query = activeOnly ? { is_active: true } : {};
    const plans = await SubscriptionPlan.find(query)
      .skip(skip)
      .limit(limit);

    const total = await SubscriptionPlan.countDocuments(query);

    res.json({
      data: {
        items: plans,
        total,
        skip,
        limit,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPlan: RequestHandler = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.plan_id);

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePlan: RequestHandler = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.plan_id,
      req.body,
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePlan: RequestHandler = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.plan_id);

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ============ SUBSCRIPTIONS ENDPOINTS ============

export const createSubscription: RequestHandler = async (req, res) => {
  try {
    const { plan_id, user_id } = req.body;

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    // Create Razorpay subscription if plan has a razorpay_plan_id
    let razorpaySubscription = null;
    if (plan.razorpay_plan_id) {
      try {
        razorpaySubscription = await razorpay.subscriptions.create({
          plan_id: plan.razorpay_plan_id,
          customer_notify: 1,
          quantity: 1,
          total_count: 0, // 0 for infinite subscriptions
        });
      } catch (error) {
        console.error("Razorpay subscription creation error:", error);
      }
    }

    const subscription = new Subscription({
      user_id,
      plan_id,
      razorpay_subscription_id: razorpaySubscription?.id,
      status: "pending",
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    });

    const savedSubscription = await subscription.save();

    // For Razorpay hosted checkout, create a short URL
    let short_url = null;
    if (razorpaySubscription) {
      try {
        const shortUrl = await razorpay.subscriptions.retrieveSignupLink(
          razorpaySubscription.id,
          {
            receipt: `sub_${savedSubscription._id}`,
          }
        );
        short_url = shortUrl.short_url;
      } catch (error) {
        console.error("Error creating short URL:", error);
      }
    }

    res.status(201).json({
      subscription: savedSubscription,
      short_url: short_url || null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listSubscriptions: RequestHandler = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const userId = req.query.user_id as string;

    const query = userId ? { user_id: userId } : {};
    const subscriptions = await Subscription.find(query)
      .populate("plan_id")
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments(query);

    // Format response with populated data
    const formattedSubscriptions = subscriptions.map(sub => ({
      _id: sub._id,
      user_id: sub.user_id,
      plan: sub.plan_id, // Include full plan object
      plan_id: sub.plan_id?._id, // Also include plan_id for compatibility
      razorpay_subscription_id: sub.razorpay_subscription_id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      pause_until: sub.pause_until,
      cancelled_at: sub.cancelled_at,
      next_billing_date: sub.next_billing_date,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    res.json({
      data: {
        items: formattedSubscriptions,
        total,
        skip,
        limit,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSubscription: RequestHandler = async (req, res) => {
  try {
    const subscription = await Subscription.findById(
      req.params.subscription_id
    ).populate("plan_id");

    if (!subscription) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    // Format response with populated data
    const formatted = {
      _id: subscription._id,
      user_id: subscription.user_id,
      plan: subscription.plan_id, // Include full plan object
      plan_id: subscription.plan_id?._id, // Also include plan_id for compatibility
      razorpay_subscription_id: subscription.razorpay_subscription_id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      pause_until: subscription.pause_until,
      cancelled_at: subscription.cancelled_at,
      next_billing_date: subscription.next_billing_date,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };

    res.json(formatted);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSubscription: RequestHandler = async (req, res) => {
  try {
    const { status, pause_until } = req.body;
    const updateData: any = {};

    if (status) updateData.status = status;
    if (pause_until) {
      updateData.pause_until = pause_until;
      if (status !== "active") updateData.status = "paused";
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.subscription_id,
      updateData,
      { new: true }
    ).populate("plan_id");

    if (!subscription) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    // If subscription is being cancelled, mark it in Razorpay as well
    if (status === "cancelled" && subscription.razorpay_subscription_id) {
      try {
        await razorpay.subscriptions.cancel(
          subscription.razorpay_subscription_id,
          { cancel_at_cycle_end: false }
        );
      } catch (error) {
        console.error("Error cancelling Razorpay subscription:", error);
      }
    }

    res.json(subscription);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelSubscription: RequestHandler = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.subscription_id,
      {
        status: "cancelled",
        cancelled_at: new Date(),
      },
      { new: true }
    ).populate("plan_id");

    if (!subscription) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    // Cancel in Razorpay if it has a subscription ID
    if (subscription.razorpay_subscription_id) {
      try {
        await razorpay.subscriptions.cancel(
          subscription.razorpay_subscription_id,
          { cancel_at_cycle_end: false }
        );
      } catch (error) {
        console.error("Error cancelling Razorpay subscription:", error);
      }
    }

    res.json({
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ============ ONE-TIME PAYMENT ENDPOINTS ============

export const createOrder: RequestHandler = async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      credits_to_add,
      receipt,
    } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
    });

    res.status(201).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      credits_to_add,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyPayment: RequestHandler = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || ""
    )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Create payment log
    const paymentLog = new PaymentLog({
      user_id: payment.notes?.user_id || "unknown",
      transaction_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount_paid: payment.amount / 100, // Convert from paise
      currency: payment.currency,
      credits_added: payment.notes?.credits_to_add || 0,
      status: "success",
      payment_method: payment.method,
      description: payment.description,
    });

    const savedLog = await paymentLog.save();

    res.json({
      message: "Payment verified successfully",
      payment: savedLog,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ============ COUPONS ENDPOINTS ============

export const createCoupon: RequestHandler = async (req, res) => {
  try {
    const {
      code,
      discount_percent,
      discount_amount,
      max_uses,
      expires_at,
      is_active,
      applicable_to_plans,
      applicable_to_domains,
    } = req.body;

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discount_percent,
      discount_amount,
      max_uses,
      expires_at,
      is_active,
      applicable_to_plans,
      applicable_to_domains,
      uses_count: 0,
    });

    const savedCoupon = await coupon.save();
    res.status(201).json(savedCoupon);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listCoupons: RequestHandler = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const activeOnly = req.query.active_only !== "false";

    const query = activeOnly ? { is_active: true } : {};
    const coupons = await Coupon.find(query).skip(skip).limit(limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      data: {
        items: coupons,
        total,
        skip,
        limit,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCoupon: RequestHandler = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.coupon_id);

    if (!coupon) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }

    res.json(coupon);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateCoupon: RequestHandler = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.coupon_id,
      req.body,
      { new: true }
    );

    if (!coupon) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }

    res.json(coupon);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCoupon: RequestHandler = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.coupon_id);

    if (!coupon) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }

    res.json({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ============ PAYMENT LOGS ENDPOINT ============

export const listPaymentLogs: RequestHandler = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const userId = req.query.user_id as string;

    const query = userId ? { user_id: userId } : {};
    const logs = await PaymentLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PaymentLog.countDocuments(query);

    res.json({
      data: {
        items: logs,
        total,
        skip,
        limit,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ============ APPLY COUPON ENDPOINT ============

export const applyCoupon: RequestHandler = async (req, res) => {
  try {
    const { code, amount, plan_id } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      is_active: true,
      expires_at: { $gt: new Date() },
    });

    if (!coupon) {
      res.status(404).json({ error: "Invalid or expired coupon" });
      return;
    }

    // Check if coupon has reached max uses
    if (coupon.uses_count && coupon.uses_count >= coupon.max_uses) {
      res.status(400).json({ error: "Coupon has reached maximum uses" });
      return;
    }

    // Check if coupon is applicable to this plan
    if (
      plan_id &&
      coupon.applicable_to_plans.length > 0 &&
      !coupon.applicable_to_plans.includes(plan_id)
    ) {
      res.status(400).json({
        error: "Coupon is not applicable to this plan",
      });
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_percent) {
      discountAmount = Math.round((amount * coupon.discount_percent) / 100);
    } else if (coupon.discount_amount) {
      discountAmount = Math.min(coupon.discount_amount, amount);
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    res.json({
      coupon: coupon.code,
      original_amount: amount,
      discount: discountAmount,
      final_amount: finalAmount,
      discount_percent: coupon.discount_percent || 0,
      discount_amount: coupon.discount_amount || 0,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// ============ WEBHOOK ENDPOINT ============

export const webhookHandler: RequestHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-razorpay-signature"] as string;

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const event = req.body.event;
    const data = req.body.data;

    console.log(`Webhook event received: ${event}`);

    switch (event) {
      case "payment.authorized":
      case "payment.captured":
        // Payment successful, update log
        await PaymentLog.findOneAndUpdate(
          { razorpay_payment_id: data.payment.id },
          { status: "success" }
        );
        break;

      case "payment.failed":
        // Payment failed
        await PaymentLog.findOneAndUpdate(
          { razorpay_payment_id: data.payment.id },
          { status: "failed" }
        );
        break;

      case "subscription.activated":
        // Subscription activated
        await Subscription.findOneAndUpdate(
          { razorpay_subscription_id: data.subscription.id },
          {
            status: "active",
            current_period_start: new Date(data.subscription.current_start * 1000),
            current_period_end: new Date(data.subscription.current_end * 1000),
          }
        );
        break;

      case "subscription.paused":
        // Subscription paused
        await Subscription.findOneAndUpdate(
          { razorpay_subscription_id: data.subscription.id },
          { status: "paused" }
        );
        break;

      case "subscription.cancelled":
        // Subscription cancelled
        await Subscription.findOneAndUpdate(
          { razorpay_subscription_id: data.subscription.id },
          {
            status: "cancelled",
            cancelled_at: new Date(),
          }
        );
        break;

      case "subscription.charged":
        // Subscription charged/renewed
        await PaymentLog.create({
          user_id: data.subscription.notes?.user_id || "unknown",
          transaction_id: data.payment.id,
          order_id: data.payment.order_id,
          razorpay_payment_id: data.payment.id,
          amount_paid: data.payment.amount / 100,
          currency: data.payment.currency,
          credits_added: 0, // Will be set by subscription plan
          status: "success",
          payment_method: data.payment.method,
        });
        break;

      default:
        console.log(`Unknown event: ${event}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
};
