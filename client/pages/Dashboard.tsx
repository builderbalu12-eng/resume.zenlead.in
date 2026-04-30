import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  Briefcase,
  MapPin,
  MessageSquare,
  Twitter,
  Linkedin,
  Github,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { ResumeData } from "@/types";
import { getMasterResume } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { AvatarGroup } from "@/components/AvatarGroup";
import { WhatYouCanObtain } from "@/components/WhatYouCanObtain";
import Lottie from "lottie-react";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { apiClient } from "@/services/api";
import { FloatingBlobs } from "@/components/motion/FloatingBlobs";
import { BlurFade, FadeIn, MountSlideUp, StaggerParent, FadeInItem } from "@/components/motion";
import { AnimatedGradientText } from "@/components/motion/AnimatedGradientText";

interface PipelineCounts {
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { app_name: appName, support_email: supportEmail, social_links: socialLinks, collaborators } = useAppConfig();
  const navigate = useNavigate();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineCounts | null>(null);

  // Hero cycling state
  const [heroState, setHeroState] = useState<0 | 1 | 2 | 3>(0);
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
      const resume = await getMasterResume();
      setMasterResume(resume);
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
      {
        heading: "Tailor On Any Job Site",
        description:
          "Install the Chrome extension and tailor your resume directly on LinkedIn, Naukri, Indeed and more — without ever leaving the page.",
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
                setHeroState(((heroState + 1) % states.length) as 0 | 1 | 2 | 3);
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
        : heroState === 2
          ? "Discover local businesses that need your skills on a live map. Turn nearby opportunities into real paying clients effortlessly."
          : "Install the Chrome extension and tailor your resume directly on LinkedIn, Naukri, Indeed and more — without ever leaving the page.";

  const heroGradient =
    heroState === 0
      ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400"
      : heroState === 1
        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400"
        : heroState === 2
          ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400"
          : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400";

  // Reload resume when user logs in or authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[Dashboard] User authenticated:', user.email);
      loadDashboardData();
      // Load pipeline counts
      apiClient.getApplicationStats()
        .then((stats: any) => {
          const breakdown = stats?.stageBreakdown ?? {};
          setPipeline({
            applied: breakdown.applied ?? 0,
            interview: breakdown.interview ?? 0,
            offer: breakdown.offer ?? 0,
            rejected: breakdown.rejected ?? 0,
          });
        })
        .catch(() => { /* pipeline widget is optional — fail silently */ });
    } else {
      setMasterResume(null);
      setPipeline(null);
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
    <div className="-mx-4 -my-6 md:-mx-6 md:-my-8 bg-gradient-to-b from-background via-background to-background overflow-x-hidden">

      {/* ── Authenticated Workspace Strip ─────────────────── */}
      {isAuthenticated && user && (
        <div className="border-b bg-card/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">

            {/* Greeting + credits */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Welcome back, {user.firstName}! 👋
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {masterResume
                    ? `Resume: ${masterResume.contact?.name ?? "Loaded"}`
                    : "Upload your resume to get started"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${user.has_payments ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300" : "border-border bg-muted text-muted-foreground"}`}>
                  {user.has_payments ? "Pro" : "Free"}
                </span>
                <div className="flex items-center gap-2 rounded-full border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 px-4 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                    {user.credits ?? 0} credits
                  </span>
                </div>
              </div>
            </div>


            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1 — Find Jobs */}
              <Link
                to="/findjob"
                className="group flex flex-col gap-2 rounded-xl border bg-background p-4 transition-all hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-pink-100 dark:bg-pink-900/30 p-2 transition-transform group-hover:scale-110">
                    <Briefcase className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-pink-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-pink-700 dark:group-hover:text-pink-300">
                    Find Jobs
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    AI-curated daily matches
                  </p>
                </div>
              </Link>

              {/* 2 — Tailor Resume */}
              <Link
                to={masterResume ? "/tailor" : "/upload"}
                className="group flex flex-col gap-2 rounded-xl border bg-background p-4 transition-all hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2 transition-transform group-hover:scale-110">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    {masterResume ? "Tailor Resume" : "Upload Resume"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {masterResume ? "AI-optimized for every job" : "Get started in 30 seconds"}
                  </p>
                </div>
              </Link>

              {/* 3 — Find Clients */}
              <Link
                to="/find-business"
                className="group flex flex-col gap-2 rounded-xl border bg-background p-4 transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2 transition-transform group-hover:scale-110">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    Find Clients
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Local leads on a live map
                  </p>
                </div>
              </Link>

              {/* 4 — Chrome Extension */}
              <Link
                to="/resume"
                className="group flex flex-col gap-2 rounded-xl border bg-background p-4 transition-all hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2 transition-transform group-hover:scale-110">
                    <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                    Chrome Extension
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Tailor on any job site
                  </p>
                </div>
              </Link>
            </div>

            {/* My Pipeline strip */}
            {pipeline && (pipeline.applied + pipeline.interview + pipeline.offer + pipeline.rejected) > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium shrink-0">My Pipeline:</span>
                {pipeline.applied > 0 && (
                  <button
                    onClick={() => navigate("/tracker?stage=applied")}
                    className="rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    {pipeline.applied} Applied
                  </button>
                )}
                {pipeline.interview > 0 && (
                  <button
                    onClick={() => navigate("/tracker?stage=interview")}
                    className="rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    {pipeline.interview} Interview
                  </button>
                )}
                {pipeline.offer > 0 && (
                  <button
                    onClick={() => navigate("/tracker?stage=offer")}
                    className="rounded-full border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                  >
                    {pipeline.offer} Offer
                  </button>
                )}
                {pipeline.rejected > 0 && (
                  <button
                    onClick={() => navigate("/tracker?stage=rejected")}
                    className="rounded-full border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    {pipeline.rejected} Rejected
                  </button>
                )}
                <Link to="/tracker" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1">
                  View all →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section - Modern Design */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <FloatingBlobs />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 relative z-10">
              <MountSlideUp delay={0} className="space-y-6">
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
              </MountSlideUp>

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
                    ) : heroState === 2 ? (
                      findClientsAnim ? (
                        <Lottie
                          animationData={findClientsAnim}
                          loop={true}
                          className="w-full max-w-xs sm:max-w-md mx-auto scale-110 sm:scale-125"
                        />
                      ) : (
                        <div className="h-72 w-full max-w-xs sm:max-w-md mx-auto rounded-2xl bg-slate-200/40 dark:bg-slate-800/40" />
                      )
                    ) : (
                      /* State 3 — Chrome Extension 3D card */
                      <div style={{ perspective: "1000px" }} className="relative w-full max-w-sm mx-auto">
                        <div
                          className="float-card relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-slate-800"
                        >
                          {/* Extension header */}
                          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                              <Zap className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{appName}</p>
                              <p className="text-[10px] text-violet-200">Chrome Extension</p>
                            </div>
                            <div className="ml-auto flex gap-1">
                              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                            </div>
                          </div>
                          {/* Job info */}
                          <div className="p-4 space-y-3 bg-slate-800">
                            <div className="rounded-xl bg-slate-700/60 p-3 space-y-1">
                              <p className="text-[11px] font-semibold text-slate-300">Detected Job Posting</p>
                              <p className="text-sm font-bold text-white">Software Development Lead</p>
                              <p className="text-[11px] text-slate-400">Accenture · Remote · Full-time</p>
                            </div>
                            {/* ATS score bar */}
                            <div className="rounded-xl bg-slate-700/60 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold text-slate-300">ATS Match Score</p>
                                <span className="text-sm font-black text-emerald-400">88%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-600">
                                <div className="h-1.5 w-[88%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                              </div>
                            </div>
                            {/* Tips */}
                            <div className="space-y-1.5">
                              {["Add 'Agile' to skills section", "Highlight leadership metrics", "Include cloud tech stack"].map((tip) => (
                                <div key={tip} className="flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                                  <p className="text-[11px] text-slate-300">{tip}</p>
                                </div>
                              ))}
                            </div>
                            <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-lg">
                              ⚡ Analyze &amp; Tailor Resume
                            </button>
                          </div>
                        </div>
                        {/* FREE badge */}
                        <div className="absolute -top-4 -right-4 rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-black text-emerald-950 shadow-lg shadow-emerald-500/30 rotate-3">
                          FREE
                        </div>
                      </div>
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

              <FadeIn delay={0.18} className="flex flex-col sm:flex-row gap-4 pt-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/findjob"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-2xl transition-all duration-300 group"
                  >
                    <Briefcase className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Get Started — Find Jobs
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </FadeIn>

              <FadeIn delay={0.28} className="pt-6 border-t-2 border-slate-200 dark:border-slate-800">
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
              </FadeIn>
            </div>

          {/* Right side: resume preview (state 0) or Lottie (states 1/2) */}
          <motion.div
            className={`hidden md:block relative transition-opacity duration-300 ${
              rightVisible ? "opacity-100" : "opacity-0"
            }`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.12 }}
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
                ) : heroState === 2 ? (
                  findClientsAnim ? (
                    <Lottie
                      animationData={findClientsAnim}
                      loop={true}
                      className="w-full max-w-md mx-auto scale-110 sm:scale-125 md:scale-150"
                    />
                  ) : (
                    <div className="h-72 w-full max-w-md mx-auto rounded-2xl bg-slate-200/40 dark:bg-slate-800/40" />
                  )
                ) : (
                  /* State 3 — Chrome Extension 3D card */
                  <div style={{ perspective: "1000px" }} className="relative w-full max-w-sm mx-auto">
                    <div
                      className="float-card relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-slate-800"
                    >
                      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">LandYourJob</p>
                          <p className="text-[10px] text-violet-200">Chrome Extension</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        </div>
                      </div>
                      <div className="p-4 space-y-3 bg-slate-800">
                        <div className="rounded-xl bg-slate-700/60 p-3 space-y-1">
                          <p className="text-[11px] font-semibold text-slate-300">Detected Job Posting</p>
                          <p className="text-sm font-bold text-white">Software Development Lead</p>
                          <p className="text-[11px] text-slate-400">Accenture · Remote · Full-time</p>
                        </div>
                        <div className="rounded-xl bg-slate-700/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-300">ATS Match Score</p>
                            <span className="text-sm font-black text-emerald-400">88%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-600">
                            <div className="h-1.5 w-[88%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {["Add 'Agile' to skills section", "Highlight leadership metrics", "Include cloud tech stack"].map((tip) => (
                            <div key={tip} className="flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                              <p className="text-[11px] text-slate-300">{tip}</p>
                            </div>
                          ))}
                        </div>
                        <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-lg">
                          ⚡ Analyze &amp; Tailor Resume
                        </button>
                      </div>
                    </div>
                    <div className="absolute -top-4 -right-4 rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-black text-emerald-950 shadow-lg shadow-emerald-500/30 rotate-3">
                      FREE
                    </div>
                  </div>
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
          </motion.div>
          </div>
        </div>
      </div>

      <WhatYouCanObtain />

      {/* ── Chrome Extension Showcase ─────────────────────── */}
      <BlurFade className="relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
        {/* Background glow blobs */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — text */}
            <div className="space-y-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-sm font-semibold text-violet-300">Chrome Extension</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight">
                Tailor your resume{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  on any job site
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Install our Chrome extension and tailor your resume directly from LinkedIn, Indeed, Naukri, Glassdoor — without ever leaving the page.
              </p>
              <ul className="space-y-3 text-slate-300">
                {[
                  "⚡ One-click resume tailoring on any job posting",
                  "📊 Instant ATS score with improvement tips",
                  "📄 Download tailored DOCX in seconds",
                  "🔔 Works on LinkedIn, Indeed, Naukri & more",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/resume"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 px-7 py-3.5 font-bold text-white shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                Install Extension
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right — 3D extension UI mockup */}
            <div className="relative flex items-center justify-center">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-cyan-500/30 blur-3xl rounded-3xl" />

              {/* 3D perspective wrapper */}
              <div style={{ perspective: "1000px" }} className="relative w-full max-w-sm mx-auto">
                <div
                  className="float-card relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] bg-slate-800"
                >
                  {/* Extension header */}
                  <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">LandYourJob</p>
                      <p className="text-[10px] text-violet-200">Chrome Extension</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                  </div>

                  {/* Job info card */}
                  <div className="p-4 space-y-3 bg-slate-800">
                    <div className="rounded-xl bg-slate-700/60 p-3 space-y-1">
                      <p className="text-[11px] font-semibold text-slate-300">Detected Job Posting</p>
                      <p className="text-sm font-bold text-white">Software Development Lead</p>
                      <p className="text-[11px] text-slate-400">Accenture · Remote · Full-time</p>
                    </div>

                    {/* ATS score bar */}
                    <div className="rounded-xl bg-slate-700/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-300">ATS Match Score</p>
                        <span className="text-sm font-black text-emerald-400">88%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-600">
                        <div className="h-1.5 w-[88%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-1.5">
                      {["Add 'Agile' to skills section", "Highlight leadership metrics", "Include cloud tech stack"].map((tip) => (
                        <div key={tip} className="flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <p className="text-[11px] text-slate-300">{tip}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTA button */}
                    <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-lg">
                      ⚡ Analyze &amp; Tailor Resume
                    </button>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-black text-emerald-950 shadow-lg shadow-emerald-500/30 rotate-3">
                  FREE
                </div>
              </div>
            </div>

          </div>
        </div>
      </BlurFade>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <StaggerParent className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <FadeInItem>
              <p className="text-white font-bold mb-3 text-sm">Product</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/findjob" className="hover:text-white transition-colors">Find Jobs</Link></li>
                <li><Link to="/find-business" className="hover:text-white transition-colors">Find Clients</Link></li>
              </ul>
            </FadeInItem>
            <FadeInItem>
              <p className="text-white font-bold mb-3 text-sm">Account</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/billing" className="hover:text-white transition-colors">Billing</Link></li>
              </ul>
            </FadeInItem>
            <FadeInItem>
              <p className="text-white font-bold mb-3 text-sm">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </FadeInItem>
            <FadeInItem>
            <div>
              <p className="text-white font-bold mb-3 text-sm">Support</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                {supportEmail && (
                  <li>
                    <a href={`mailto:${supportEmail}`} className="hover:text-white transition-colors text-xs">
                      {supportEmail}
                    </a>
                  </li>
                )}
              </ul>
              {/* Social Links */}
              {Object.values(socialLinks).some(Boolean) && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Twitter">
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.github && (
                    <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="GitHub">
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
            </FadeInItem>
          </StaggerParent>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <p>© {new Date().getFullYear()} {appName} · ZenLead. All rights reserved.</p>
              {collaborators.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Made with ❤️ by</span>
                  <AvatarGroup collaborators={collaborators} max={4} size="sm" />
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link to="/refund-policy" className="hover:text-slate-300 transition-colors">Refunds</Link>
              <Link to="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat Button - only for authenticated users */}
      {isAuthenticated && <FloatingChatButton />}
    </div>
  );
};
