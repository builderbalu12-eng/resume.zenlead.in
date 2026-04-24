import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, ChevronDown, Copy, Download, Share2, BookOpen } from "lucide-react";
import { ResumeData, JobDescription } from "@/types";
import { getMasterResume } from "@/utils/storage";
import { TemplateSelector } from "@/components/TemplateSelector";
import { apiClient } from "@/services/api";
import { generateResumeDocx } from "@/services/resumeGenerator";
import { saveApplication } from "@/services/mongodb";
import { Page } from "@/components/layout/Page";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { SectionHeader } from "@/components/premium/SectionHeader";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/premium/States";

// ── Constants ────────────────────────────────────────────────────────────────

const SCORE_CATEGORIES = [
  { key: "formatting", label: "Parsability" },
  { key: "keywords",   label: "Keyword Density" },
  { key: "structure",  label: "Title Alignment" },
  { key: "relevance",  label: "Experience Match" },
];

const TIPS = [
  "Submit as PDF unless the application requests DOCX",
  "Keep formatting clean — no tables, columns, or text boxes",
  "Tailor the summary section for each role you apply to",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ATSDonutChart({ score, primary }: { score: number; primary?: boolean }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = primary
    ? score >= 75 ? "#22c55e" : score >= 50 ? "#f97316" : "#ef4444"
    : "#94a3b8";
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="12"
          className="text-muted/30" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black">{score}</span>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoadmapEntry {
  skill: string;
  timeEstimate: string;
  overview: string;
  steps: { label: string; action: string }[];
  resources: { type: string; name: string }[];
}

// ── Main Component ────────────────────────────────────────────────────────────

export const TailorResume: React.FC = () => {
  const navigate = useNavigate();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showResume, setShowResume] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingContentSections, setMissingContentSections] = useState<string[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [copied, setCopied] = useState(false);

  const [tailorState, setTailorState] = useState<{
    tailored: ResumeData | null;
    atsScore: number;
    originalAtsScore: number;
    jobData: JobDescription | null;
    scoreBreakdown: Record<string, number>;
    originalScoreBreakdown: Record<string, number>;
    issueCount: number;
    aiSuggestions: string[];
    keywordsAdded: string[];
    keywordsPresent: string[];
    bulletsRewritten: number;
    skillsMatchedPct: number;
  }>({
    tailored: null,
    atsScore: 0,
    originalAtsScore: 0,
    jobData: null,
    scoreBreakdown: {},
    originalScoreBreakdown: {},
    issueCount: 0,
    aiSuggestions: [],
    keywordsAdded: [],
    keywordsPresent: [],
    bulletsRewritten: 0,
    skillsMatchedPct: 0,
  });

  const [coverLetterState, setCoverLetterState] = useState<{
    text: string | null;
    loading: boolean;
    open: boolean;
  }>({ text: null, loading: false, open: false });

  const [roadmapState, setRoadmapState] = useState<{
    data: { skillGaps: string[]; roadmaps: RoadmapEntry[] } | null;
    loading: boolean;
    open: boolean;
  }>({ data: null, loading: false, open: false });

  // ── Resume loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadResume = async () => {
      setIsLoading(true);
      try {
        const resume = await getMasterResume();
        if (!resume) {
          setError("No master resume found. Please upload one first.");
          setTimeout(() => navigate("/upload"), 2000);
          return;
        }
        setMasterResume(resume);
      } catch {
        setError("Failed to load master resume.");
      } finally {
        setIsLoading(false);
      }
    };
    loadResume();
  }, []);

  useEffect(() => {
    const handleResumeUpdate = async () => {
      const resume = await getMasterResume();
      if (resume) setMasterResume(resume);
    };
    window.addEventListener("storage", handleResumeUpdate);
    document.addEventListener("visibilitychange", handleResumeUpdate);
    return () => {
      window.removeEventListener("storage", handleResumeUpdate);
      document.removeEventListener("visibilitychange", handleResumeUpdate);
    };
  }, []);

  // Reset results when master resume changes
  useEffect(() => {
    if (masterResume && tailorState.tailored) {
      setTailorState(s => ({ ...s, tailored: null }));
      setMissingContentSections([]);
    }
  }, [masterResume]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTailor = async () => {
    if (!masterResume || !jobDescription.trim()) {
      setError("❌ Please enter a job description before tailoring");
      return;
    }

    setIsTailoring(true);
    setError(null);
    setSuccess(null);
    setMissingContentSections([]);

    const tailorTimeout = setTimeout(() => {
      setIsTailoring(false);
      setError(
        "⏱️ Resume tailoring took too long (2+ minutes).\n\nPlease try shortening the job description or try again in a moment.",
      );
    }, 120000);

    try {
      const resumeStr = JSON.stringify(masterResume);

      const tailorResult = await apiClient.tailorResume(resumeStr, jobDescription);
      const parseResult = await apiClient.parseJob(jobDescription);
      const originalAtsResult = await apiClient.getATSScore(resumeStr, jobDescription);

      const tailoredAtsScore: number = tailorResult.estimatedATSScore || 0;
      const originalAtsScore: number = (originalAtsResult as any).atsScore || 0;

      const jobData: JobDescription = {
        title: parseResult.jobTitle || "",
        company: parseResult.company || "",
        location: parseResult.location || "",
        description: parseResult.description || jobDescription.substring(0, 500),
        requirements: Array.isArray(parseResult.responsibilities)
          ? parseResult.responsibilities
          : (parseResult.preferredSkills || []),
        skills: parseResult.requiredSkills || [],
      };

      const tailored: ResumeData = {
        ...masterResume,
        summary: tailorResult.summary || masterResume.summary,
        skills:
          Array.isArray(tailorResult.skills) && tailorResult.skills.length > 0
            ? tailorResult.skills.filter((s: string) =>
                masterResume.skills.some((ms) => ms.toLowerCase() === s.toLowerCase()),
              )
            : masterResume.skills,
        experience: masterResume.experience.map((exp) => {
          const t = tailorResult.experience?.find(
            (te: any) =>
              te.title?.toLowerCase() === exp.title.toLowerCase() &&
              te.company?.toLowerCase() === exp.company.toLowerCase(),
          );
          return {
            ...exp,
            description: t?.description?.length > 0 ? t.description : exp.description,
          };
        }),
        projects: masterResume.projects?.map((proj) => {
          const t = tailorResult.projects?.find(
            (tp: any) => tp.title?.toLowerCase() === proj.title.toLowerCase(),
          );
          return {
            ...proj,
            description: t?.description?.trim() ? t.description : proj.description,
          };
        }),
      };

      // ── Computed metrics ──────────────────────────────────────────────────
      const jdKeywords = [
        ...(parseResult.requiredSkills || []),
        ...(parseResult.preferredSkills || []),
      ];
      const origSkillsLower = masterResume.skills.map(s => s.toLowerCase());
      const keywordsAdded = jdKeywords.filter(k => !origSkillsLower.includes(k.toLowerCase()));
      const keywordsPresent = jdKeywords.filter(k => origSkillsLower.includes(k.toLowerCase()));
      const bulletsRewritten = masterResume.experience.filter(exp => {
        const te = tailored.experience.find(
          t => t.title.toLowerCase() === exp.title.toLowerCase()
        );
        return te && te.description.some((b: string, i: number) => b !== exp.description[i]);
      }).length;
      const skillsMatchedPct = jdKeywords.length > 0
        ? Math.round(((keywordsPresent.length + keywordsAdded.length) / jdKeywords.length) * 100)
        : 0;
      const aiSuggestions = ((originalAtsResult as any).improvements || [])
        .map((item: any) => item.suggestion || item.issue)
        .filter(Boolean)
        .slice(0, 5);
      const originalScoreBreakdown = (originalAtsResult as any).scoreBreakdown || {};

      clearTimeout(tailorTimeout);
      setTailorState({
        tailored,
        atsScore: tailoredAtsScore,
        originalAtsScore,
        jobData,
        scoreBreakdown: (tailorResult as any).scoreBreakdown || (originalAtsResult as any).scoreBreakdown || {},
        originalScoreBreakdown,
        issueCount: ((originalAtsResult as any).improvements || []).length,
        aiSuggestions,
        keywordsAdded,
        keywordsPresent,
        bulletsRewritten,
        skillsMatchedPct,
      });

      setMissingContentSections([]);
      setSuccess(`✅ Resume tailored! ATS Score: ${originalAtsScore}% → ${tailoredAtsScore}%`);

      // Reset bonus sections on new tailor
      setCoverLetterState({ text: null, loading: false, open: false });
      setRoadmapState({ data: null, loading: false, open: false });
    } catch (err) {
      clearTimeout(tailorTimeout);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Insufficient credits")) {
        setError(`💳 Insufficient credits:\n\n${msg}\n\nPlease purchase more credits to continue.`);
      } else if (msg.includes("Unauthorized")) {
        setError("🔐 Authentication error:\n\nPlease log in again to continue.");
      } else {
        setError(`❌ Tailoring failed:\n\n${msg || "Unknown error occurred"}\n\nPlease try again.`);
      }
    } finally {
      setIsTailoring(false);
    }
  };

  const handleReset = () => {
    setTailorState({
      tailored: null,
      atsScore: 0,
      originalAtsScore: 0,
      jobData: null,
      scoreBreakdown: {},
      originalScoreBreakdown: {},
      issueCount: 0,
      aiSuggestions: [],
      keywordsAdded: [],
      keywordsPresent: [],
      bulletsRewritten: 0,
      skillsMatchedPct: 0,
    });
    setJobDescription("");
    setSuccess(null);
    setMissingContentSections([]);
    setCoverLetterState({ text: null, loading: false, open: false });
    setRoadmapState({ data: null, loading: false, open: false });
  };

  const handleOpenTemplateSelector = () => {
    if (tailorState.tailored && tailorState.jobData) setShowTemplateSelector(true);
  };

  const handleSaveApplication = async () => {
    if (!tailorState.tailored || !tailorState.jobData || !masterResume) return;
    try {
      await saveApplication({
        userId: "current-user",
        jobTitle: tailorState.jobData.title,
        company: tailorState.jobData.company,
        jobDescription: tailorState.jobData,
        originalResume: masterResume,
        tailoredResume: tailorState.tailored,
        atsScore: tailorState.atsScore,
        matchPercentage: tailorState.atsScore,
        appliedDate: new Date(),
        status: "applied",
      });
      setSuccess("✓ Application saved to history!");
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleCopyResume = () => {
    if (!tailorState.tailored) return;
    const r = tailorState.tailored;
    const text = [
      r.contact.name,
      [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean).join(" | "),
      "",
      r.summary ? `SUMMARY\n${r.summary}` : "",
      r.skills.length ? `SKILLS\n${r.skills.join(", ")}` : "",
      r.experience.length
        ? `EXPERIENCE\n${r.experience.map(e =>
            `${e.title} at ${e.company} (${e.startDate} - ${e.endDate || "Present"})\n${e.description.map(b => `• ${b}`).join("\n")}`
          ).join("\n\n")}`
        : "",
    ].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareWhatsApp = () => {
    const diff = tailorState.atsScore - tailorState.originalAtsScore;
    const msg = `I improved my ATS score by ${diff} points using ResumeMatch AI! Check it out at resume.zenlead.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleShareLinkedIn = () => {
    const url = "https://resume.zenlead.in";
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  };

  const handleGenerateCoverLetter = async () => {
    if (!tailorState.tailored || !jobDescription) return;
    setCoverLetterState(s => ({ ...s, loading: true }));
    try {
      const result = await apiClient.generateCoverLetter(
        JSON.stringify(tailorState.tailored),
        jobDescription,
      );
      setCoverLetterState({ text: result.coverLetter, loading: false, open: true });
    } catch (e: any) {
      setError(e?.message || "Failed to generate cover letter");
      setCoverLetterState(s => ({ ...s, loading: false }));
    }
  };

  const handleDownloadCoverLetterDocx = async () => {
    if (!coverLetterState.text) return;
    const { Document, Paragraph, TextRun, Packer } = await import("docx");
    const doc = new Document({
      sections: [{
        properties: {},
        children: coverLetterState.text.split("\n").map(
          line => new Paragraph({ children: [new TextRun(line || " ")] })
        ),
      }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${tailorState.jobData?.company || "Job"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateRoadmap = async () => {
    if (!tailorState.tailored || !jobDescription) return;
    setRoadmapState(s => ({ ...s, loading: true }));
    try {
      const result = await apiClient.generateSkillsRoadmap(
        JSON.stringify(tailorState.tailored),
        jobDescription,
      );
      setRoadmapState({ data: result, loading: false, open: true });
    } catch (e: any) {
      setError(e?.message || "Failed to generate skills roadmap");
      setRoadmapState(s => ({ ...s, loading: false }));
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const rewrittenBulletSample: { before: string; after: string } | null = (() => {
    if (!tailorState.tailored || !masterResume) return null;
    for (const exp of masterResume.experience) {
      const te = tailorState.tailored.experience.find(
        t => t.title.toLowerCase() === exp.title.toLowerCase()
      );
      if (!te) continue;
      for (let i = 0; i < Math.min(exp.description.length, te.description.length); i++) {
        if (exp.description[i] !== te.description[i]) {
          return { before: exp.description[i], after: te.description[i] };
        }
      }
    }
    return null;
  })();

  const improvement = tailorState.atsScore - tailorState.originalAtsScore;

  // ── Render guards ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Page size="lg">
        <LoadingState title="Loading your resume" description="Retrieving your master resume…" className="max-w-xl" />
      </Page>
    );
  }

  if (!masterResume) {
    return (
      <Page size="md">
        <ErrorState title="No master resume found" description={error ?? "Please upload a master resume first."} className="max-w-xl" />
      </Page>
    );
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <Page size="xl">
      {showTemplateSelector && tailorState.tailored && tailorState.jobData && (
        <TemplateSelector
          resume={tailorState.tailored}
          jobData={tailorState.jobData}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      <div className="mb-8">
        <SectionHeader
          title="Tailor your resume"
          description="Use your master resume and tailor it for any job description."
        />
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive whitespace-pre-wrap font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-600/10 border border-green-600/20 flex gap-3">
          <AlertCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-600 font-medium">{success}</p>
        </div>
      )}

      {/* ── PRE-TAILORING: 2-column layout ─────────────────────────────────── */}
      {!tailorState.tailored && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Master Resume Preview */}
          <PremiumCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Master Resume</h2>
              <Button onClick={() => setShowResume(!showResume)} variant="ghost" size="icon" className="rounded-xl">
                {showResume ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
            {showResume && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <div>
                  <h3 className="font-semibold text-base mb-2">{masterResume.contact.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {masterResume.contact.email && <p>{masterResume.contact.email}</p>}
                    {masterResume.contact.phone && <p>{masterResume.contact.phone}</p>}
                    {masterResume.contact.location && <p>{masterResume.contact.location}</p>}
                  </div>
                </div>
                {masterResume.summary && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">{masterResume.summary}</p>
                  </div>
                )}
                {masterResume.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {masterResume.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {masterResume.experience.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Experience</h4>
                    <div className="space-y-2">
                      {masterResume.experience.map((exp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{exp.company} • {exp.startDate}{exp.endDate && ` - ${exp.endDate}`}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {masterResume.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Education</h4>
                    <div className="space-y-2">
                      {masterResume.education.map((edu, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">{edu.degree} in {edu.field}</p>
                          <p className="text-xs text-muted-foreground">{edu.institution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!showResume && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Resume details hidden</p>
                <button onClick={() => setShowResume(true)} className="text-primary hover:underline mt-2">Show resume</button>
              </div>
            )}
          </PremiumCard>

          {/* Right: Job Description Input */}
          <PremiumCard className="p-6" hover={false}>
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-[300px] p-3 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleTailor}
              disabled={isTailoring || !jobDescription.trim()}
              className="w-full mt-4"
              variant="gradient"
            >
              {isTailoring ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Tailoring your resume...</>
              ) : (
                "Tailor resume"
              )}
            </Button>
            {isTailoring && (
              <div className="mt-4 p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
                <div className="flex items-start gap-3">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-600">Processing your resume</p>
                    <p className="text-xs text-blue-600/70 mt-1">Analyzing job requirements and tailoring for maximum ATS compatibility…</p>
                    <p className="text-xs text-blue-600/70 mt-2">This may take 20–60 seconds.</p>
                  </div>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>
      )}

      {/* ── POST-TAILORING: 3-column results ────────────────────────────────── */}
      {tailorState.tailored && (
        <>
          {/* Compact action bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {tailorState.jobData?.title && tailorState.jobData?.company
                  ? `Tailored for ${tailorState.jobData.title} at ${tailorState.jobData.company}`
                  : "Resume tailored successfully"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSaveApplication}>Save to history</Button>
            <Button variant="secondary" size="sm" onClick={handleReset}>Tailor another</Button>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Your Optimized Resume ───────────────────────────── */}
            <PremiumCard className="p-5" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <h3 className="font-semibold text-sm">Your Optimized Resume</h3>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyResume} className="h-7 px-2 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              {/* Resume preview */}
              <div className="max-h-[420px] overflow-y-auto space-y-3 text-sm border border-border rounded-lg p-3 bg-white dark:bg-slate-900">
                <div>
                  <p className="font-bold text-base">{tailorState.tailored.contact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[tailorState.tailored.contact.email, tailorState.tailored.contact.phone, tailorState.tailored.contact.location].filter(Boolean).join(" | ")}
                  </p>
                </div>
                {tailorState.tailored.summary && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">Summary</p>
                    <p className="text-xs leading-relaxed">{tailorState.tailored.summary}</p>
                  </div>
                )}
                {tailorState.tailored.skills.length > 0 && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">Skills</p>
                    <p className="text-xs leading-relaxed">{tailorState.tailored.skills.join(" • ")}</p>
                  </div>
                )}
                {tailorState.tailored.experience.length > 0 && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">Experience</p>
                    <div className="space-y-2">
                      {tailorState.tailored.experience.map((exp, i) => (
                        <div key={i}>
                          <p className="font-semibold text-xs">{exp.title} | {exp.company}</p>
                          <p className="text-xs text-muted-foreground">{exp.startDate} – {exp.endDate || "Present"}</p>
                          <ul className="mt-1 space-y-0.5">
                            {exp.description.slice(0, 3).map((b, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex gap-1"><span>•</span><span>{b}</span></li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-2">
                <Button variant="gradient" className="w-full h-10 text-sm" onClick={handleOpenTemplateSelector}>
                  Unlock PDF & DOCX Download
                </Button>
                <p className="text-xs text-center text-muted-foreground">Share your result 🎉</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleShareWhatsApp}>
                    <Share2 className="h-3 w-3 mr-1" />WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleShareLinkedIn}>
                    <Share2 className="h-3 w-3 mr-1" />LinkedIn
                  </Button>
                </div>
              </div>
            </PremiumCard>

            {/* ── Middle: What Changed ───────────────────────────────────── */}
            <PremiumCard className="p-5" hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <h3 className="font-semibold text-sm">What Changed</h3>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-indigo-500/10 p-2 text-center">
                  <p className="text-xl font-black text-indigo-500">{tailorState.keywordsAdded.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Keywords Present</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                  <p className="text-xl font-black text-blue-500">{tailorState.bulletsRewritten}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Bullets Rewritten</p>
                </div>
                <div className="rounded-lg bg-violet-500/10 p-2 text-center">
                  <p className="text-xl font-black text-violet-500">{tailorState.skillsMatchedPct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Skills Matched</p>
                </div>
              </div>

              {/* Keywords Added */}
              {tailorState.keywordsAdded.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">ATS KEYWORDS ADDED</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tailorState.keywordsAdded.slice(0, 15).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-medium">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords Present */}
              {tailorState.keywordsPresent.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">KEYWORDS ALREADY PRESENT</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tailorState.keywordsPresent.slice(0, 12).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 border border-slate-300 dark:border-slate-600 text-xs rounded-full">
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {tailorState.aiSuggestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">AI SUGGESTIONS</p>
                  <ul className="space-y-1.5">
                    {tailorState.aiSuggestions.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2">
                        <span className="text-indigo-500 font-bold shrink-0">→</span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rewritten Bullets Sample */}
              {rewrittenBulletSample && (
                <div>
                  <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">REWRITTEN BULLETS (SAMPLE)</p>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-2.5">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Before</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rewrittenBulletSample.before}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">After</p>
                      <p className="text-xs leading-relaxed">{rewrittenBulletSample.after}</p>
                    </div>
                  </div>
                </div>
              )}
            </PremiumCard>

            {/* ── Right: ATS Score ───────────────────────────────────────── */}
            <PremiumCard className="p-5" hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <h3 className="font-semibold text-sm">ATS Score</h3>
              </div>

              {/* Before / After donut charts */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <ATSDonutChart score={tailorState.originalAtsScore} primary={false} />
                  <p className="text-xs text-muted-foreground mt-1">Before</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl text-muted-foreground">→</span>
                  {improvement > 0 && (
                    <span className="text-xs font-black text-emerald-500">+{improvement}</span>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <ATSDonutChart score={tailorState.atsScore} primary />
                  <p className="text-xs text-muted-foreground mt-1">After</p>
                </div>
              </div>

              {/* Rubric note */}
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                <span className="font-semibold">100-point ATS rubric:</span>{" "}
                Parsability (20) · Keyword Density (35) · Title Alignment (25) · Experience Match (20).{" "}
                {tailorState.jobData && <span>Industry: <span className="font-medium">Tech</span>.</span>}
              </p>

              {/* Score Breakdown */}
              {Object.keys(tailorState.scoreBreakdown).length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground">SCORE BREAKDOWN</p>
                  {SCORE_CATEGORIES.map(({ key, label }) => {
                    const afterVal = tailorState.scoreBreakdown[key] ?? 0;
                    const beforeVal = tailorState.originalScoreBreakdown[key] ?? 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium tabular-nums">{beforeVal} → {afterVal}</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
                          <div
                            className="h-full rounded-full bg-slate-400/40 absolute top-0 left-0 transition-all duration-500"
                            style={{ width: `${beforeVal}%` }}
                          />
                          <div
                            className="h-full rounded-full bg-indigo-500 absolute top-0 left-0 transition-all duration-700"
                            style={{ width: `${afterVal}%`, opacity: 0.85 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-slate-400/40 rounded-full inline-block" /> Before</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-indigo-500/85 rounded-full inline-block" /> After</span>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div>
                <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">TIPS</p>
                <ul className="space-y-1.5">
                  {TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </PremiumCard>
          </div>

          {/* ── Cover Letter Generator ─────────────────────────────────────── */}
          <div className="mt-6">
            <PremiumCard hover={false} className="p-5">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setCoverLetterState(s => ({ ...s, open: !s.open }))}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <h3 className="font-semibold text-sm">Cover Letter Generator</h3>
                  {!coverLetterState.text && (
                    <span className="text-xs text-amber-500 font-medium">3 credits</span>
                  )}
                  {coverLetterState.text && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">Generated</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${coverLetterState.open ? "rotate-180" : ""}`} />
              </button>

              {coverLetterState.open && (
                <div className="mt-4">
                  {!coverLetterState.text ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate a tailored cover letter based on your optimized resume and this job.
                      </p>
                      <Button onClick={handleGenerateCoverLetter} disabled={coverLetterState.loading} variant="gradient">
                        {coverLetterState.loading
                          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
                          : "Generate Cover Letter (3 credits)"}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2 mb-3">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => navigator.clipboard.writeText(coverLetterState.text!)}>
                          <Copy className="h-3 w-3 mr-1" />Copy
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={handleDownloadCoverLetterDocx}>
                          <Download className="h-3 w-3 mr-1" />Download DOCX
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs ml-auto" onClick={handleGenerateCoverLetter} disabled={coverLetterState.loading}>
                          {coverLetterState.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Regenerate"}
                        </Button>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{coverLetterState.text}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </PremiumCard>
          </div>

          {/* ── Skills Learning Roadmap ────────────────────────────────────── */}
          <div className="mt-4">
            <PremiumCard hover={false} className="p-5">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setRoadmapState(s => ({ ...s, open: !s.open }))}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <h3 className="font-semibold text-sm">Skills Learning Roadmap</h3>
                  <span className="text-xs bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">+ PRO</span>
                  {roadmapState.data && (
                    <span className="text-xs text-muted-foreground">
                      {roadmapState.data.roadmaps.length} skill{roadmapState.data.roadmaps.length !== 1 ? "s" : ""} to learn
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${roadmapState.open ? "rotate-180" : ""}`} />
              </button>

              {roadmapState.open && (
                <div className="mt-4">
                  {!roadmapState.data ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Pick up the top skills you're missing and get a week-by-week learning plan with free resources.
                      </p>
                      <Button onClick={handleGenerateRoadmap} disabled={roadmapState.loading} variant="gradient">
                        {roadmapState.loading
                          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
                          : "Generate Learning Roadmap (1 credit)"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {roadmapState.data.roadmaps.map((roadmap, idx) => (
                        <div key={idx} className="rounded-xl border border-border p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-base">{roadmap.skill}</h4>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded-full">
                              {roadmap.timeEstimate}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{roadmap.overview}</p>

                          {/* Learning Path */}
                          {roadmap.steps.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-bold tracking-widest text-muted-foreground mb-3">LEARNING PATH</p>
                              <div className="space-y-2">
                                {roadmap.steps.map((step, si) => (
                                  <div key={si} className="flex gap-3">
                                    <span className="shrink-0 text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg w-20 text-center">
                                      {step.label}
                                    </span>
                                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">{step.action}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {roadmap.resources.length > 0 && (
                            <div>
                              <p className="text-xs font-bold tracking-widest text-muted-foreground mb-2">RESOURCES</p>
                              <ul className="space-y-1">
                                {roadmap.resources.map((res, ri) => (
                                  <li key={ri} className="text-xs flex gap-2">
                                    <span className="shrink-0 font-semibold text-indigo-600 dark:text-indigo-400">{res.type}:</span>
                                    <span className="text-muted-foreground">{res.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </PremiumCard>
          </div>
        </>
      )}
    </Page>
  );
};
