import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileUp,
  Zap,
  BarChart3,
  ArrowRight,
  Briefcase,
  Users,
} from "lucide-react";
import { ResumeData, ApplicationRecord } from "@/types";
import { getApplicationHistory } from "@/services/mongodb";
import { getMasterResume } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { WhatYouCanObtain } from "@/components/WhatYouCanObtain";
import Lottie from "lottie-react";

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [recentApplications, setRecentApplications] = useState<
    ApplicationRecord[]
  >([]);
  const [stats, setStats] = useState({
    totalApps: 0,
    avgScore: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSummary, setExpandedSummary] = useState(false);

  // Hero cycling state
  const [heroState, setHeroState] = useState<0 | 1 | 2>(0);
  const [typedText, setTypedText] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const [rightVisible, setRightVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const [jobSearchAnim, setJobSearchAnim] = useState<any | null>(null);
  const [findClientsAnim, setFindClientsAnim] = useState<any | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const typingIntervalRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const isPausedRef = useRef(false);

  // Load dashboard data when user logs in or page loads
  const loadDashboardData = async () => {
    try {
      console.log('[Dashboard] Loading resume and application history...');
      const resume = await getMasterResume();
      console.log('[Dashboard] Master resume loaded:', resume?.contact?.name ?? 'No resume');
      setMasterResume(resume);

      const apps = await getApplicationHistory();
      setRecentApplications(apps.slice(0, 5));

      if (apps.length > 0) {
        const avgScore = Math.round(
          apps.reduce(
            (sum, a) => sum + (a.atsScore || a.matchPercentage || 0),
            0,
          ) / apps.length,
        );
        const successCount = apps.filter(
          (a) => a.status === "offer" || a.status === "interview",
        ).length;
        const successRate = Math.round((successCount / apps.length) * 100);

        setStats({
          totalApps: apps.length,
          avgScore,
          successRate,
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [jobRes, leadRes] = await Promise.all([
          fetch("/anime/jobsearch.json"),
          fetch("/anime/findclients.json"),
        ]);
        const [jobJson, leadJson] = await Promise.all([jobRes.json(), leadRes.json()]);
        if (cancelled) return;
        setJobSearchAnim(jobJson);
        setFindClientsAnim(leadJson);
      } catch (e) {
        console.error("Failed to load hero animations", e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const states = [
      {
        heading: "AI Tailors Your Resume",
        description:
          "Automatically tailor your resume for every job application. Get instant ATS scores and land interviews 3x faster with AI-powered optimization.",
      },
      {
        heading: "Let AI Find Your Job",
        description:
          "Automatically searches LinkedIn, Naukri, Indeed, Unstop and more. Get daily AI-curated job matches sent straight to you — zero manual searching.",
      },
      {
        heading: "Find Your Lead,Clients",
        description:
          "Discover local businesses that need your skills on a live map. Turn nearby opportunities into real paying clients effortlessly.",
      },
    ] as const;

    // Clear timers FIRST
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];

    // Reset per-state UI
    setTypedText("");
    setShowDesc(false);
    setIsTyping(true);
    setHeroVisible(true);

    // Right side fade out then in for new content
    setRightVisible(false);
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setRightVisible(true);
      }, 300),
    );

    const current = states[heroState];
    let i = 0;
    typingIntervalRef.current = window.setInterval(() => {
      i += 1;
      setTypedText(current.heading.slice(0, i));
      if (i >= current.heading.length) {
        if (typingIntervalRef.current) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
        setShowDesc(true);

        // Wait 3s, fade out, then switch state
        timeoutsRef.current.push(
          window.setTimeout(() => {
            if (isPausedRef.current) return;
            setHeroVisible(false);
            setRightVisible(false);
            timeoutsRef.current.push(
              window.setTimeout(() => {
                if (isPausedRef.current) return;
                setHeroState(((heroState + 1) % states.length) as 0 | 1 | 2);
              }, 300),
            );
          }, 3000),
        );
      }
    }, 40);

    return () => {
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroState]);

  const heroDescription =
    heroState === 0
      ? "Automatically tailor your resume for every job application. Get instant ATS scores and land interviews 3x faster with AI-powered optimization."
      : heroState === 1
        ? "Automatically searches LinkedIn, Naukri, Indeed, Unstop and more. Get daily AI-curated job matches sent straight to you — zero manual searching."
        : "Discover local businesses that need your skills on a live map. Turn nearby opportunities into real paying clients effortlessly.";

  const heroGradient =
    heroState === 0
      ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400"
      : heroState === 1
        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400"
        : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400";

  // Reload resume when user logs in or authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[Dashboard] User authenticated:', user.email);
      // Refresh resume data when user logs in
      loadDashboardData();
    } else {
      console.log('[Dashboard] User logged out - clearing resume');
      // Clear resume when user logs out
      setMasterResume(null);
      setRecentApplications([]);
      setStats({ totalApps: 0, avgScore: 0, successRate: 0 });
    }
  }, [isAuthenticated, user]);

  // Refresh resume when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('[Dashboard] Page became visible - refreshing resume');
        const resume = await getMasterResume();
        setMasterResume(resume);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = async () => {
      console.log('[Dashboard] Storage changed in another tab - refreshing resume');
      const resume = await getMasterResume();
      if (resume) {
        setMasterResume(resume);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="-mx-4 -my-6 md:-mx-6 md:-my-8 bg-gradient-to-b from-background via-background to-background">
      {/* Hero Section - Modern Design */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-600/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/30 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 border border-cyan-300/50 dark:border-cyan-700/50 backdrop-blur-sm">
                  <p className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                    ✨ AI-Powered Resume Optimization
                  </p>
                </div>

                <div className="space-y-3">
                  <h1
                    className={`text-4xl sm:text-5xl lg:text-6xl font-black font-heading leading-tight min-h-[60px] sm:min-h-[60px] lg:min-h-[130px] transition-opacity duration-300 ${
                      heroVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <span className={`${heroGradient} bg-clip-text text-transparent`}>
                      {typedText}
                      {isTyping && (
                        <span className="ml-1 inline-block animate-pulse align-middle">
                          |
                        </span>
                      )}
                    </span>
                  </h1>
                </div>
              </div>

              <p
                className={`text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium transition-opacity duration-300 motion-reduce:transition-none ${
                  heroVisible && showDesc ? "opacity-100" : "opacity-0"
                }`}
              >
                {heroDescription}
              </p>

              {/* Mobile: show right-side content under title/description */}
              <div
                className={`relative md:hidden transition-opacity duration-300 ${
                  rightVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {heroState === 0 ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/25 via-purple-400/25 to-pink-400/25 rounded-3xl blur-2xl opacity-50" />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-2xl max-h-[420px] overflow-y-auto">
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            {masterResume?.contact.name ?? "John Doe"}
                          </h3>
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <p className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-cyan-500" />
                              {masterResume?.contact.email ?? "john.doe@example.com"}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-purple-500" />
                              {masterResume?.contact.phone ?? "(555) 555-5555"}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-pink-500" />
                              {masterResume?.contact.location ?? "San Francisco, CA"}
                            </p>
                          </div>
                        </div>

                        <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-5">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {masterResume?.summary ??
                              "Experienced software engineer with a track record of building scalable web applications and improving product metrics."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {heroState === 1 ? (
                      jobSearchAnim ? (
                        <Lottie
                          animationData={jobSearchAnim}
                          loop={true}
                          className="w-full max-w-xs sm:max-w-md mx-auto scale-110 sm:scale-125"
                        />
                      ) : (
                        <div className="h-72 w-full max-w-xs sm:max-w-md mx-auto rounded-2xl bg-slate-200/40 dark:bg-slate-800/40" />
                      )
                    ) : findClientsAnim ? (
                      <Lottie
                        animationData={findClientsAnim}
                        loop={true}
                        className="w-full max-w-xs sm:max-w-md mx-auto scale-110 sm:scale-125"
                      />
                    ) : (
                      <div className="h-72 w-full max-w-xs sm:max-w-md mx-auto rounded-2xl bg-slate-200/40 dark:bg-slate-800/40" />
                    )}

                    {/* Pause / resume icon button in bottom-right of Lottie area */}
                    <button
                      onClick={() => {
                        const next = !isPausedRef.current;
                        isPausedRef.current = next;
                        setIsPaused(next);

                        // If resuming after pause, restart the wait/transition timer
                        if (!next && !isTyping && showDesc) {
                          setHeroState((prev) => prev);
                        }
                      }}
                      className="absolute bottom-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                      title={isPaused ? "Resume animation" : "Pause animation"}
                    >
                      {isPaused ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {!masterResume ? (
                  <Link
                    to="/upload"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <FileUp className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Upload Your Resume
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/tailor"
                      className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <Zap className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Tailor Your Resume
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/history"
                      className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-bold hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300"
                    >
                      View History
                    </Link>
                  </>
                )}
              </div>

              <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-semibold">
                  Trusted by thousands of job seekers:
                </p>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                  </div>
                  <span>10,000+ successful applications</span>
                </div>
              </div>
            </div>

          {/* Right side: resume preview (state 0) or Lottie (states 1/2) */}
          <div
            className={`hidden md:block relative transition-opacity duration-300 ${
              rightVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {heroState === 0 ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 via-purple-400/30 to-pink-400/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-slate-200 dark:border-slate-800 shadow-2xl hover:shadow-3xl transition-all duration-300 max-h-[600px] overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {masterResume?.contact.name ?? "John Doe"}
                      </h3>
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-cyan-500" />
                          {masterResume?.contact.email ?? "john.doe@example.com"}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-purple-500" />
                          {masterResume?.contact.phone ?? "(555) 555-5555"}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-pink-500" />
                          {masterResume?.contact.location ?? "San Francisco, CA"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-6">
                      <div className="space-y-3">
                        <p
                          className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${
                            expandedSummary ? "" : "line-clamp-2"
                          }`}
                        >
                          {masterResume?.summary ??
                            "Experienced software engineer with a track record of building scalable web applications and improving product metrics."}
                        </p>
                        {masterResume?.summary && masterResume.summary.length > 200 && (
                          <button
                            onClick={() => setExpandedSummary(!expandedSummary)}
                            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                          >
                            {expandedSummary ? "▼ Show less" : "▶ Show more"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-slate-100">
                        Top Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(masterResume?.skills ?? [
                          "JavaScript",
                          "React",
                          "Node.js",
                          "TypeScript",
                          "AWS",
                        ])
                          .slice(0, 6)
                          .map((s) => (
                            <span
                              key={s}
                              className="px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:from-cyan-200 hover:to-blue-200 dark:hover:from-cyan-800/50 dark:hover:to-blue-800/50 transition-all"
                            >
                              {s}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-6">
                      <h4 className="text-sm font-bold mb-4 text-slate-900 dark:text-slate-100">
                        Recent Role
                      </h4>
                      {(masterResume?.experience && masterResume.experience.length
                        ? masterResume.experience.slice(0, 1)
                        : [
                            {
                              title: "Senior Software Engineer",
                              company: "Acme Corp",
                              startDate: "Jan 2020",
                              endDate: "Present",
                              description: [
                                "Led a team to build a customer-facing web app.",
                                "Improved load times by 40% through optimizations.",
                              ],
                            },
                          ]
                      ).map((exp) => (
                        <div key={exp.title} className="text-sm space-y-3">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {exp.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 font-semibold">
                              {exp.company} • {exp.startDate}{" "}
                              {exp.endDate ? `– ${exp.endDate}` : "– Present"}
                            </div>
                          </div>
                          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-xs space-y-1">
                            {exp.description.slice(0, 2).map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {masterResume && (
                      <div className="flex gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
                        <Link
                          to="/tailor"
                          className="flex-1 inline-flex items-center justify-center px-3 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold transition-all"
                        >
                          Tailor Resume
                        </Link>

                        <Link
                          to="/upload"
                          className="flex-1 inline-flex items-center justify-center px-3 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-all"
                        >
                          Upload New
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {heroState === 1 ? (
                  jobSearchAnim ? (
                    <Lottie
                      animationData={jobSearchAnim}
                      loop={true}
                      className="w-full max-w-md mx-auto scale-110 sm:scale-125 md:scale-150"
                    />
                  ) : (
                    <div className="h-72 w-full max-w-md mx-auto rounded-2xl bg-slate-200/40 dark:bg-slate-800/40" />
                  )
                ) : findClientsAnim ? (
                  <Lottie
                    animationData={findClientsAnim}
                    loop={true}
                    className="w-full max-w-md mx-auto scale-110 sm:scale-125 md:scale-150"
                  />
                ) : (
                  <div className="h-72 w-full max-w-md mx-auto rounded-2xl bg-slate-200/40 dark:bg-slate-800/40" />
                )}

                {/* Pause / resume icon button in bottom-right of Lottie area */}
                <button
                  onClick={() => {
                    const next = !isPausedRef.current;
                    isPausedRef.current = next;
                    setIsPaused(next);

                    // If resuming after pause, restart the wait/transition timer
                    if (!next && !isTyping && showDesc) {
                      setHeroState((prev) => prev);
                    }
                  }}
                  className="absolute bottom-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                  title={isPaused ? "Resume animation" : "Pause animation"}
                >
                  {isPaused ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <WhatYouCanObtain />

      {/* Features Section - Modern Cards */}
      <div className="relative py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black font-heading">
              <span className="text-slate-900 dark:text-slate-100">How </span>
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                ResumeMatch Pro
              </span>
              <span className="text-slate-900 dark:text-slate-100"> Works</span>
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              Our intelligent AI system analyzes job requirements and optimizes
              your resume for maximum impact in seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileUp,
                title: "Upload Your Master Resume",
                description:
                  "Upload your professional resume once. We parse and store all your experience, skills, and education.",
                number: "01",
                gradient: "from-cyan-500 to-blue-600",
                lightGradient: "from-cyan-100 to-blue-100",
                darkGradient: "from-cyan-900/30 to-blue-900/30",
              },
              {
                icon: Zap,
                title: "AI-Powered Tailoring",
                description:
                  "Our AI analyzes job postings and rewrites your resume to highlight the most relevant skills and experience.",
                number: "02",
                gradient: "from-purple-500 to-pink-600",
                lightGradient: "from-purple-100 to-pink-100",
                darkGradient: "from-purple-900/30 to-pink-900/30",
              },
              {
                icon: BarChart3,
                title: "ATS Score Optimization",
                description:
                  "Get real-time ATS compatibility scores and specific suggestions to improve your resume visibility.",
                number: "03",
                gradient: "from-emerald-500 to-teal-600",
                lightGradient: "from-emerald-100 to-teal-100",
                darkGradient: "from-emerald-900/30 to-teal-900/30",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 hover:border-opacity-50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-2xl`}
                />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div
                      className={`rounded-xl bg-gradient-to-br ${feature.lightGradient} dark:${feature.darkGradient} p-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon
                        className={`h-7 w-7 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                      />
                    </div>
                    <span
                      className={`text-5xl font-black opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                    >
                      {feature.number}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {masterResume && recentApplications.length > 0 && (
        <div className="relative py-24 sm:py-32 bg-gradient-to-r from-slate-100 via-blue-50 to-purple-100 dark:from-slate-900 dark:via-blue-900/30 dark:to-purple-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-3xl sm:text-4xl font-black font-heading mb-10 text-slate-900 dark:text-slate-100">
                Recent Applications
              </h3>
              <div className="grid gap-5">
                {recentApplications.map((app, idx) => (
                  <div
                    key={app._id || app.id || `app-${idx}`}
                    className="group flex items-center justify-between p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:translate-x-1"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                        {app.jobTitle}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {app.company}
                      </p>
                    </div>
                    <div className="text-right ml-6 flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-lg">
                        {app.atsScore || app.matchPercentage}%
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 capitalize font-bold mt-2">
                        {app.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/history"
                className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mt-10 hover:text-purple-700 dark:hover:text-purple-300 transition-all group text-lg"
              >
                View all applications
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials / Social proof placeholder (edit content later if needed) */}
      <div className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-3 text-center">
            <h3 className="text-3xl sm:text-4xl font-black font-heading text-slate-900 dark:text-slate-100">
              People using ResumeMatch
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              A few snapshots of how job seekers and freelancers use the product every day.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Sana · Data Analyst",
                quote:
                  "I stopped manually editing my resume. Now I just paste a job description and ResumeMatch does the rest.",
              },
              {
                name: "Arjun · Frontend Engineer",
                quote:
                  "The Chrome extension + AI job search feed means I can apply to 10 targeted roles in the time it used to take for 1.",
              },
              {
                name: "Meera · Freelance Developer",
                quote:
                  "The Find Clients map showed me local businesses without websites. It literally became my outbound client list.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm"
              >
                <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                  “{t.quote}”
                </p>
                <p className="mt-auto text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Bold & Vibrant */}
      <div className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />

        {/* Animated gradient blobs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-tl from-purple-500 to-pink-600 opacity-20 blur-3xl animate-pulse" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading leading-tight">
            <span className="text-white">Ready to</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Land Your Dream Job?
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Start tailoring your resume for every application and increase your
            chances of getting noticed by hiring managers. Join thousands of
            successful job seekers.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            {!masterResume ? (
              <Link
                to="/upload"
                className="inline-flex items-center justify-center px-10 py-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 group"
              >
                Get Started Now
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                to="/tailor"
                className="inline-flex items-center justify-center px-10 py-5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-black text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 group"
              >
                Tailor Your Resume
                <Zap className="h-6 w-6 ml-3 group-hover:scale-110 transition-transform" />
              </Link>
            )}
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-10 py-5 rounded-xl border-2 border-white hover:bg-white hover:text-slate-900 text-white font-black text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
