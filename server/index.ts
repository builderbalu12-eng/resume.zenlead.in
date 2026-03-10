import express, { Express } from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./db";
import {
  getUserResume,
  saveUserResume,
  saveUser,
  loginUser,
  getApplicationHistory,
  saveApplication,
  updateApplicationStatus,
} from "./routes/resume";
import { getMe, updateMe, changePassword } from "./routes/user";
import { getStatus, getLink, getQR, unlink } from "./routes/telegram";
import { authMiddleware } from "./middleware/auth";
import {
  createPlan,
  listPlans,
  getPlan,
  updatePlan,
  deletePlan,
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  createOrder,
  verifyPayment,
  createCoupon,
  listCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  listPaymentLogs,
  applyCoupon,
  webhookHandler,
} from "./routes/payments";

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Connect to database
  connectDB().catch(console.error);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User routes
  app.post("/api/auth/register", saveUser);
  app.post("/api/auth/login", loginUser);
  app.post("/api/users", saveUser);
  app.get("/api/user/me", authMiddleware, getMe);
  app.patch("/api/user/me", authMiddleware, updateMe);
  app.post("/api/user/me/change-password", authMiddleware, changePassword);
  app.get("/api/users/:userId/resume", getUserResume);
  app.post("/api/users/:userId/resume", saveUserResume);

  // Telegram routes
  app.get("/api/telegram/status", authMiddleware, getStatus);
  app.get("/api/telegram/link", authMiddleware, getLink);
  app.get("/api/telegram/qr", authMiddleware, getQR);
  app.delete("/api/telegram/unlink", authMiddleware, unlink);

  // Application routes
  app.get("/api/applications", getApplicationHistory);
  app.post("/api/applications", saveApplication);
  app.patch("/api/applications/:appId", updateApplicationStatus);

  // Payment routes - Subscription Plans
  app.post("/api/payments/subscription-plans", createPlan);
  app.get("/api/payments/subscription-plans", listPlans);
  app.get("/api/payments/subscription-plans/:plan_id", getPlan);
  app.put("/api/payments/subscription-plans/:plan_id", updatePlan);
  app.delete("/api/payments/subscription-plans/:plan_id", deletePlan);

  // Payment routes - Subscriptions
  app.post("/api/payments/subscriptions", createSubscription);
  app.get("/api/payments/subscriptions", listSubscriptions);
  app.get("/api/payments/subscriptions/:subscription_id", getSubscription);
  app.put("/api/payments/subscriptions/:subscription_id", updateSubscription);
  app.delete("/api/payments/subscriptions/:subscription_id", cancelSubscription);

  // Payment routes - One-time Orders
  app.post("/api/payments/create-order", createOrder);
  app.post("/api/payments/verify", verifyPayment);

  // Payment routes - Coupons
  app.post("/api/payments/coupons", createCoupon);
  app.get("/api/payments/coupons", listCoupons);
  app.get("/api/payments/coupons/:coupon_id", getCoupon);
  app.put("/api/payments/coupons/:coupon_id", updateCoupon);
  app.delete("/api/payments/coupons/:coupon_id", deleteCoupon);

  // Payment routes - Logs, Coupons Application, and Webhook
  app.get("/api/payments/logs", listPaymentLogs);
  app.post("/api/payments/apply-coupon", applyCoupon);
  app.post("/api/payments/webhook", webhookHandler);

  // Serve SPA in production
  const spa_path = path.join(process.cwd(), "dist/spa");
  app.use(express.static(spa_path));

  // SPA fallback
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(spa_path, "index.html"));
    }
  });

  return app;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log(`ResumeMatch Pro server listening on http://localhost:${port}`);
  });
}
