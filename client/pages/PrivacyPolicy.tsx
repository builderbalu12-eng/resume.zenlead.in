import { Link } from "react-router-dom";
import { useAppConfig } from "@/contexts/AppConfigContext";

export function PrivacyPolicy() {
  const { app_name: rawAppName, support_email: supportEmail } = useAppConfig();
  const appName = rawAppName || "LandYourJob";
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">Last updated: April 10, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Who We Are</h2>
            <p>
              {appName} ("we", "us", "our") is operated by ZenLead (trading as LandYourJob) and available at{" "}
              <a href="https://landyourjob.zenlead.in" className="text-blue-600 dark:text-blue-400 underline">
                landyourjob.zenlead.in
              </a>. We provide an AI-powered SaaS platform for resume tailoring and ATS score analysis. We do not guarantee employment, placement, or job interviews. We are not a recruitment agency.
            </p>
            <p className="mt-3">
              For privacy questions, contact us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
                {supportEmail}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Data We Collect</h2>
            <h3 className="font-semibold mb-2">Account Registration</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>First name, last name</li>
              <li>Email address</li>
              <li>Password (stored as a hashed value — never in plain text)</li>
            </ul>
            <h3 className="font-semibold mb-2">Resume Data</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Contact details in your resume: name, email, phone, location, LinkedIn, GitHub</li>
              <li>Work experience, education, skills, projects, certifications</li>
              <li>Professional summary</li>
            </ul>
            <h3 className="font-semibold mb-2">Usage Data</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Job postings you analyse (job title, company, URL)</li>
              <li>ATS scores and keyword match results</li>
              <li>Application history and status</li>
              <li>Credits usage and transaction history</li>
            </ul>
            <h3 className="font-semibold mb-2">Payment Data</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Plan selected, currency, amount paid</li>
              <li>Cashfree payment IDs and order IDs (we do not store card numbers or bank details — Cashfree handles all payment card data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Chrome Extension Data</h2>
            <p className="mb-3">
              When you use the {appName} Chrome extension on a job posting page:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>The extension reads the job description text from the page you are viewing</li>
              <li>This text is sent to our server and then to Google Gemini AI to generate a tailored resume</li>
              <li>Job page content is processed only when you click "Analyse Job" — it is never captured passively</li>
              <li>Your master resume and auth token are stored in <code>chrome.storage.sync</code> (local to your browser, synced across your signed-in Chrome devices)</li>
              <li>We do not read, store, or transmit any other content from pages you visit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To create and maintain your account</li>
              <li>To tailor your resume to job postings using AI</li>
              <li>To calculate ATS match scores</li>
              <li>To process payments and manage your subscription or credits</li>
              <li>To send Telegram notifications (if you opt in)</li>
              <li>To improve our service through aggregated, anonymised analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Third Parties We Share Data With</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Cashfree (Payment Processor)</h3>
                <p className="text-sm">
                  We use Cashfree to process payments. Cashfree receives your transaction amount, currency, and order information. Cashfree's privacy policy applies to payment data:{" "}
                  <a href="https://www.cashfree.com/privacy-policy/" className="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                    cashfree.com/privacy-policy
                  </a>
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Google Gemini AI</h3>
                <p className="text-sm">
                  Your resume content and job description text are sent to the Google Gemini API to generate a tailored resume and ATS score. This data is sent only when you initiate an analysis. Google does not store this data beyond processing the request under our API usage agreement.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Google Analytics</h3>
                <p className="text-sm">
                  We use Google Analytics (measurement ID: G-20D27HKD4T) to understand how users interact with our website. This may include anonymised IP addresses, pages visited, and session duration. You can opt out via the Google Analytics Opt-out Browser Add-on.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Google OAuth</h3>
                <p className="text-sm">
                  If you choose to sign in with Google, we receive your name and email address from Google. We do not receive your Google password.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Data Storage and Security</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>All data is stored in a MongoDB database with access controls</li>
              <li>Passwords are hashed before storage</li>
              <li>All data in transit is encrypted via HTTPS (TLS)</li>
              <li>We do not sell, rent, or trade your personal data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Data Retention</h2>
            <p>
              We retain your account data as long as your account is active. Application history and resume data are kept until you delete them or close your account. Payment logs are retained for 7 years as required for financial compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Your Rights</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Access:</strong> Request a copy of all data we hold about you</li>
              <li><strong>Correction:</strong> Update your personal details via your Profile page</li>
              <li><strong>Deletion:</strong> Close your account to permanently delete all your data from our servers</li>
              <li><strong>Portability:</strong> Request an export of your resume and application data</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
                {supportEmail}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Cookies</h2>
            <p>
              We use browser localStorage and sessionStorage to maintain your login session. We do not use tracking cookies beyond what Google Analytics sets. You can clear these at any time via your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Children's Privacy</h2>
            <p>
              {appName} is not intended for users under the age of 18. We do not knowingly collect personal data from minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify users of material changes via email or a banner on the website. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">12. Contact</h2>
            <p>
              For any privacy-related questions or data requests:
              <br />
              Email:{" "}
              <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
                {supportEmail}
              </a>
              <br />
              Website:{" "}
              <a href="https://landyourjob.zenlead.in/contact" className="text-blue-600 dark:text-blue-400 underline">
                landyourjob.zenlead.in/contact
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</Link>
          <Link to="/refund-policy" className="hover:text-slate-700 dark:hover:text-slate-300">Refund Policy</Link>
          <Link to="/contact" className="hover:text-slate-700 dark:hover:text-slate-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}
