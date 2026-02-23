# Payment System Documentation

This document describes the complete payment system implementation with Razorpay integration, subscription management, and payment logging.

## Overview

The payment system includes:
- **Subscription Plans**: Create and manage subscription plans with credits per cycle
- **Subscriptions**: Manage user subscriptions to plans
- **One-time Payments**: Process one-time credit purchases via Razorpay
- **Coupons**: Create and apply discount coupons
- **Payment Logs**: Track all payment transactions
- **Webhooks**: Handle Razorpay events in real-time

## Setup & Configuration

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/resumematch-pro

# Razorpay API Keys (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Server Port (optional)
PORT=8080
```

### 2. Razorpay Setup

1. Create a Razorpay account at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Copy your Key ID and Key Secret
4. Set up a webhook at Dashboard → Settings → Webhooks with the following events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.paused`
   - `subscription.cancelled`
   - `subscription.charged`

### 3. Database Setup

The system uses MongoDB. Ensure MongoDB is running:

```bash
# If using local MongoDB
mongod

# Or connect to a cloud MongoDB instance (MongoDB Atlas, etc.)
```

## API Endpoints

### Subscription Plans

#### Create Plan
```
POST /api/payments/subscription-plans
Content-Type: application/json

{
  "plan_name": "Pro Monthly",
  "amount": 999,
  "currency": "INR",
  "period": "monthly",
  "interval": 1,
  "credits_per_cycle": 100,
  "description": "Professional plan with 100 credits per month",
  "is_active": true,
  "applicable_to": ["domain1.com"]
}
```

#### List Plans
```
GET /api/payments/subscription-plans?skip=0&limit=20&active_only=true
```

#### Get Plan
```
GET /api/payments/subscription-plans/{plan_id}
```

#### Update Plan
```
PUT /api/payments/subscription-plans/{plan_id}
Content-Type: application/json

{
  "amount": 1299,
  "credits_per_cycle": 150
}
```

#### Delete Plan
```
DELETE /api/payments/subscription-plans/{plan_id}
```

### Subscriptions

#### Create Subscription
```
POST /api/payments/subscriptions
Content-Type: application/json

{
  "plan_id": "plan_mongo_id",
  "user_id": "user_id_string"
}
```

Response includes `short_url` for Razorpay hosted checkout.

#### List Subscriptions
```
GET /api/payments/subscriptions?skip=0&limit=20&user_id=optional_user_id
```

#### Get Subscription
```
GET /api/payments/subscriptions/{subscription_id}
```

#### Update Subscription
```
PUT /api/payments/subscriptions/{subscription_id}
Content-Type: application/json

{
  "status": "paused",
  "pause_until": "2026-03-01T00:00:00Z"
}
```

#### Cancel Subscription
```
DELETE /api/payments/subscriptions/{subscription_id}
```

### One-time Payments

#### Create Order
```
POST /api/payments/create-order
Content-Type: application/json

{
  "amount": 500,
  "currency": "INR",
  "credits_to_add": 50,
  "receipt": "receipt_unique_id"
}
```

Response contains `order_id` and Razorpay `key`.

#### Verify Payment
```
POST /api/payments/verify
Content-Type: application/json

{
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_order_id": "order_xxxxx",
  "razorpay_signature": "signature_xxxxx"
}
```

### Coupons

#### Create Coupon
```
POST /api/payments/coupons
Content-Type: application/json

{
  "code": "SAVE20",
  "discount_percent": 20,
  "max_uses": 100,
  "expires_at": "2026-12-31T23:59:59Z",
  "is_active": true,
  "applicable_to_plans": ["plan_id_1", "plan_id_2"],
  "applicable_to_domains": ["domain1.com", "domain2.com"]
}
```

#### List Coupons
```
GET /api/payments/coupons?skip=0&limit=20&active_only=true
```

#### Get Coupon
```
GET /api/payments/coupons/{coupon_id}
```

#### Update Coupon
```
PUT /api/payments/coupons/{coupon_id}
Content-Type: application/json

{
  "discount_percent": 25,
  "is_active": false
}
```

#### Delete Coupon
```
DELETE /api/payments/coupons/{coupon_id}
```

#### Apply Coupon
```
POST /api/payments/apply-coupon
Content-Type: application/json

{
  "code": "SAVE20",
  "amount": 1000,
  "plan_id": "optional_plan_id"
}
```

Response:
```json
{
  "coupon": "SAVE20",
  "original_amount": 1000,
  "discount": 200,
  "final_amount": 800,
  "discount_percent": 20
}
```

### Payment Logs

#### List Payment Logs
```
GET /api/payments/logs?skip=0&limit=20&user_id=optional_user_id
```

### Webhooks

#### Webhook Endpoint
```
POST /api/payments/webhook
```

Razorpay will send webhook events to this endpoint. The system automatically:
- Updates payment status
- Activates/pauses/cancels subscriptions
- Logs subscription renewals

## Frontend Integration

The client already has payment UI components:
- `PricingHub.tsx` - Main pricing and payment interface
- `OneTimePayment.tsx` - One-time payment checkout
- `Checkout.tsx` - Subscription checkout redirect
- `SubscriptionManagement.tsx` - User subscription management
- `PaymentHistory.tsx` - Payment transaction history

The API client (`client/services/api.ts`) provides all necessary methods:

```typescript
import { apiClient } from '@/services/api';

// Get subscription plans
const plans = await apiClient.getSubscriptionPlans();

// Create subscription
const sub = await apiClient.createSubscription(planId, userId);
window.location.href = sub.short_url; // Redirect to Razorpay checkout

// Create one-time payment
const order = await apiClient.createPaymentOrder(500, 'INR', 50);
// Use with Razorpay checkout widget

// Verify payment
const result = await apiClient.verifyPayment(paymentId, orderId, signature);

// Apply coupon
const discount = await apiClient.applyCoupon('SAVE20', 1000);

// Get payment logs
const logs = await apiClient.getPaymentLogs();

// Manage subscriptions
const subs = await apiClient.getSubscriptions();
await apiClient.cancelSubscription(subscriptionId);
```

## Database Schema

### SubscriptionPlan
```typescript
{
  _id: ObjectId
  plan_name: string
  amount: number
  currency: string
  period: "daily" | "monthly" | "yearly"
  interval: number
  credits_per_cycle: number
  description: string
  is_active: boolean
  applicable_to: string[]
  razorpay_plan_id: string (optional)
  createdAt: Date
  updatedAt: Date
}
```

### Subscription
```typescript
{
  _id: ObjectId
  user_id: string
  plan_id: ObjectId (ref: SubscriptionPlan)
  razorpay_subscription_id: string (optional)
  status: "active" | "paused" | "cancelled" | "pending"
  current_period_start: Date
  current_period_end: Date
  pause_until: Date (optional)
  cancelled_at: Date (optional)
  next_billing_date: Date (optional)
  createdAt: Date
  updatedAt: Date
}
```

### PaymentLog
```typescript
{
  _id: ObjectId
  user_id: string
  transaction_id: string (unique)
  order_id: string
  razorpay_payment_id: string (optional)
  razorpay_signature: string (optional)
  amount_paid: number
  currency: string
  credits_added: number
  status: "success" | "failed" | "pending"
  payment_method: string (optional)
  description: string (optional)
  createdAt: Date
  updatedAt: Date
}
```

### Coupon
```typescript
{
  _id: ObjectId
  code: string (unique)
  discount_percent: number (optional)
  discount_amount: number (optional)
  max_uses: number
  uses_count: number
  expires_at: Date
  is_active: boolean
  applicable_to_plans: string[]
  applicable_to_domains: string[]
  createdAt: Date
  updatedAt: Date
}
```

## Testing

### Manual Testing with cURL

#### Create a subscription plan:
```bash
curl -X POST http://localhost:8080/api/payments/subscription-plans \
  -H "Content-Type: application/json" \
  -d '{
    "plan_name": "Test Plan",
    "amount": 999,
    "currency": "INR",
    "period": "monthly",
    "interval": 1,
    "credits_per_cycle": 100,
    "description": "Test subscription plan",
    "is_active": true,
    "applicable_to": []
  }'
```

#### List plans:
```bash
curl http://localhost:8080/api/payments/subscription-plans
```

#### Create a coupon:
```bash
curl -X POST http://localhost:8080/api/payments/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST20",
    "discount_percent": 20,
    "max_uses": 100,
    "expires_at": "2026-12-31T23:59:59Z",
    "is_active": true,
    "applicable_to_plans": [],
    "applicable_to_domains": []
  }'
```

## Security Notes

1. **API Keys**: Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` secure. Never expose them in frontend code.

2. **Signature Verification**: All payment verification includes HMAC-SHA256 signature verification.

3. **Webhook Signature**: Webhook endpoints verify the signature before processing events.

4. **Database Connection**: Use strong MongoDB credentials and enable network access restrictions.

5. **HTTPS**: Always use HTTPS in production, especially for payment endpoints.

## Common Issues

### MongoDB Connection Fails
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` is correct
- For MongoDB Atlas, whitelist your IP address

### Razorpay API Errors
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Ensure you're using the right environment (test vs production keys)
- Check Razorpay API key permissions

### Webhook Not Triggering
- Verify webhook URL is publicly accessible
- Check webhook secret matches in Razorpay dashboard
- Review Razorpay webhook logs for delivery status

### Payment Verification Fails
- Ensure signature is verified correctly
- Check that request includes all three parameters (payment_id, order_id, signature)
- Verify the amount in the order matches the verified payment

## Next Steps

1. Set up MongoDB connection
2. Add Razorpay API keys to environment
3. Test endpoints with sample data
4. Configure webhook in Razorpay dashboard
5. Deploy to production with proper security measures
