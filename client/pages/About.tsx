import { Link } from "react-router-dom";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { FileText, Target, Chrome, BarChart3 } from "lucide-react";

export function About() {
  const { app_name: appName, support_email: supportEmail } = useAppConfig();
  const name = appName ?? "LandYourJob";

  const features = [
    {
      icon: <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-100 dark:bg-blue-900/30",
      title: "AI Resume Tailoring",
      desc: "Upload your resume once. For every job you apply to, our AI rewrites your summary, experience bullets, and skills order to match the job description — without inventing anything.",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />,
      bg: "bg-green-100 dark:bg-green-900/30",
      title: "ATS Score & Keyword Analysis",
      desc: "See how well your resume matches a job before you apply: matched keywords, missing keywords, and concrete suggestions to improve your score.",
    },
    {
      icon: <Chrome className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      bg: "bg-purple-100 dark:bg-purple-900/30",
      title: "Chrome Extension",
      desc: "Tailor your resume directly on LinkedIn, Indeed, Naukri, and other job boards — one click on any job posting.",
    },
    {
      icon: <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      bg: "bg-orange-100 dark:bg-orange-900/30",
      title: "Application Tracking",
      desc: "Keep every application, tailored resume, and ATS score in one place so you always know where you stand.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">About {name}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
          {name} is an AI-powered SaaS platform that helps job seekers get past Applicant
          Tracking Systems (ATS) and land more interviews. We tailor your resume to each
          job description — honestly, using only your real experience.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <p className="font-bold text-slate-900 dark:text-white mb-1">{f.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Our story</h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
            Most resumes are rejected by software before a human ever reads them. Job seekers
            spend hours manually rewriting their resume for every application — or send the
            same generic resume everywhere and hear nothing back.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {name} was built to fix that: professional-grade resume tailoring and ATS analysis,
            available to everyone in minutes, at a fraction of what resume-writing services charge.
            We never fabricate experience, employers, or metrics — the AI works only with what is
            genuinely on your resume.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">How it works</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
            <li>Upload your resume (PDF or DOCX) — it stays your single source of truth.</li>
            <li>Paste a job description, or open any job posting with our Chrome extension.</li>
            <li>Get a tailored resume, ATS score, keyword analysis, and a matching cover letter.</li>
            <li>Download as PDF/DOCX and apply with confidence.</li>
          </ol>
        </section>

        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Business Details</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ZenLead (trading as LandYourJob)
            <br />
            Operated by Balakrishna Akula
            <br />
            Second Floor, 28 A/5 B, Kamala Nivas, Jia Sarai, Hauz Khas,
            <br />
            New Delhi, Delhi 110016, India
            <br />
            Email:{" "}
            <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 underline">
              {supportEmail}
            </a>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/pricing" className="hover:text-slate-700 dark:hover:text-slate-300">Pricing</Link>
          <Link to="/privacy-policy" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</Link>
          <Link to="/refund-policy" className="hover:text-slate-700 dark:hover:text-slate-300">Refund Policy</Link>
          <Link to="/contact" className="hover:text-slate-700 dark:hover:text-slate-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}
