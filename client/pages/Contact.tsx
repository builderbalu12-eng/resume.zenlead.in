import { Link } from "react-router-dom";
import { Mail, Clock, MessageSquare, Phone } from "lucide-react";
import { useAppConfig } from "@/contexts/AppConfigContext";

export function Contact() {
  const { app_name: appName, support_email: supportEmail } = useAppConfig();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Contact Us</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10">
          We're here to help. Reach out and we'll get back to you as soon as possible.
        </p>

        <div className="space-y-4">
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Email Support</p>
              <p className="text-blue-600 dark:text-blue-400 font-medium">{supportEmail}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                For account issues, billing questions, and general inquiries
              </p>
            </div>
          </a>

          <a
            href="tel:+919573217566"
            className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-green-400 dark:hover:border-green-500 transition-colors group"
          >
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
              <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Phone Support</p>
              <p className="text-green-600 dark:text-green-400 font-medium">+91 95732 17566</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monday – Saturday, 10 AM – 6 PM IST
              </p>
            </div>
          </a>

          <div className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Response Time</p>
              <p className="text-slate-700 dark:text-slate-300 font-medium">Within 2 business days</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monday – Saturday, 10 AM – 6 PM IST
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Refund Requests</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">
                Email us with subject "Refund Request" and include your Razorpay transaction ID.
                See our{" "}
                <Link to="/refund-policy" className="text-blue-600 dark:text-blue-400 underline">
                  Refund Policy
                </Link>{" "}
                for full details.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Business Details</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ZenLead
            <br />
            {appName} — AI Resume Tailoring
            <br />
            Phone:{" "}
            <a href="tel:+919573217566" className="text-blue-600 dark:text-blue-400 underline">
              +91 95732 17566
            </a>
            <br />
            Email:{" "}
            <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
              {supportEmail}
            </a>
            <br />
            Website:{" "}
            <a href="https://resume.zenlead.in" className="text-blue-600 dark:text-blue-400 underline">
              resume.zenlead.in
            </a>
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/privacy-policy" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</Link>
          <Link to="/refund-policy" className="hover:text-slate-700 dark:hover:text-slate-300">Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
