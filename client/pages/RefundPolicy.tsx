import { Link } from "react-router-dom";
import { useAppConfig } from "@/contexts/AppConfigContext";

export function RefundPolicy() {
  const { support_email: supportEmail } = useAppConfig();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Refund & Cancellation Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">Last updated: April 10, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Subscriptions — Cancellation</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You can cancel your subscription at any time from your{" "}
                <Link to="/billing" className="text-blue-600 dark:text-blue-400 underline">Billing page</Link>.</li>
              <li>Cancellation takes effect at the <strong>end of the current billing period</strong> — you continue to have access until then.</li>
              <li>No charges are made after cancellation.</li>
              <li>You will not receive a prorated refund for the unused portion of the current billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Subscriptions — Refunds</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Subscription charges are generally <strong>non-refundable</strong> once billed.</li>
              <li>If you believe you were charged in error (e.g., duplicate charge), contact us within <strong>7 days</strong> of the charge and we will investigate.</li>
              <li>Refunds for genuine billing errors will be processed back to your original payment method within 5–10 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. One-Time Credit Purchases</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Credits purchased as a one-time payment are <strong>non-refundable once purchased</strong>.</li>
              <li>Credits do not expire and carry forward indefinitely on your account.</li>
              <li>If a credit purchase was not reflected in your account, email us within 48 hours with your transaction ID and we will resolve it immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Free Trial / Free Plan</h2>
            <p>
              The Free plan includes a limited number of credits at no cost. No payment is required and no refund applies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. How to Request a Refund</h2>
            <p className="mb-3">To request a refund for a billing error:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Email{" "}
                <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
                  {supportEmail}
                </a>{" "}
                with subject line: <strong>"Refund Request"</strong></li>
              <li>Include your registered email address</li>
              <li>Include the Razorpay transaction ID or order ID from your billing page</li>
              <li>Describe the issue briefly</li>
            </ol>
            <p className="mt-3">We will respond within 2 business days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Disputes</h2>
            <p>
              If you are unsatisfied with the resolution of a refund request, you may escalate the dispute through your bank or payment provider. We encourage you to contact us first so we can resolve the issue directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Contact</h2>
            <p>
              Email:{" "}
              <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
                {supportEmail}
              </a>
              <br />
              Response time: within 2 business days
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/privacy-policy" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</Link>
          <Link to="/contact" className="hover:text-slate-700 dark:hover:text-slate-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}
