import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { ResumeData, JobDescription } from "@/types";
import {
  getMasterResume,
} from "@/utils/storage";
import { TemplateSelector } from "@/components/TemplateSelector";
import { apiClient } from "@/services/api";
import { generateResumeDocx } from "@/services/resumeGenerator";
import { saveApplication } from "@/services/mongodb";
import { Page } from "@/components/layout/Page";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { SectionHeader } from "@/components/premium/SectionHeader";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/premium/States";

export const TailorResume: React.FC = () => {
  const navigate = useNavigate();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showResume, setShowResume] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingContentSections, setMissingContentSections] = useState<
    string[]
  >([]);

  const [tailorState, setTailorState] = useState<{
    tailored: ResumeData | null;
    atsScore: number;
    originalAtsScore: number;
    jobData: JobDescription | null;
    scoreBreakdown: Record<string, number>;
    issueCount: number;
  }>({
    tailored: null,
    atsScore: 0,
    originalAtsScore: 0,
    jobData: null,
    scoreBreakdown: {},
    issueCount: 0,
  });
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Load resume on component mount and when user navigates to this page
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
      } catch (err) {
        setError("Failed to load master resume.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResume();
  }, []);

  // Listen for resume updates from the web app
  useEffect(() => {
    const handleResumeUpdate = async () => {
      const resume = await getMasterResume();
      if (resume) {
        setMasterResume(resume);
      }
    };

    // Listen for messages from the popup or other tabs
    window.addEventListener("storage", handleResumeUpdate);

    return () => {
      window.removeEventListener("storage", handleResumeUpdate);
    };
  }, []);

  // Refresh resume when page becomes visible (user returns from another tab/window)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Page became visible - refresh the resume to ensure we have the latest
        const resume = await getMasterResume();
        if (resume) {
          setMasterResume(resume);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Clear tailored results and reset UI when master resume changes
  useEffect(() => {
    if (masterResume) {
      setTailorState({
        tailored: null,
        atsScore: 0,
        originalAtsScore: 0,
        jobData: null,
        scoreBreakdown: {},
        issueCount: 0,
      });
      setJobDescription("");
      setSuccess(null);
      setError(null);
      setMissingContentSections([]);
    }
  }, [masterResume?.contact.name]); // Watch for resume name change to detect new resume

  const checkMissingContentSections = (
    tailored: ResumeData,
    configuredSections: string[],
  ): string[] => {
    const missing: string[] = [];

    for (const section of configuredSections) {
      if (!section) continue;
      const sectionKey =
        section.charAt(0).toLowerCase() + section.slice(1).replace(/ /g, "");
      const sectionValue = (tailored as any)[sectionKey];

      // Check if section exists and has meaningful content
      let isEmpty = false;

      if (!sectionValue) {
        isEmpty = true;
      } else if (Array.isArray(sectionValue)) {
        // For arrays, check if they're empty or have only empty strings
        isEmpty =
          sectionValue.length === 0 ||
          sectionValue.every((item: any) => {
            if (typeof item === "string") return item.trim().length < 20;
            return false;
          });
      } else if (typeof sectionValue === "string") {
        // For strings, check if less than 20 characters or contains placeholder text
        isEmpty =
          sectionValue.trim().length < 20 ||
          sectionValue.includes("N/A") ||
          sectionValue.includes("Not available") ||
          sectionValue.includes("Not applicable");
      }

      if (isEmpty) {
        missing.push(section);
      }
    }

    return missing;
  };

  const handleTailor = async () => {
    if (!masterResume || !jobDescription.trim()) {
      setError("❌ Please enter a job description before tailoring");
      return;
    }

    setIsTailoring(true);
    setError(null);
    setSuccess(null);
    setMissingContentSections([]);

    // Add timeout for tailoring (120 seconds)
    const tailorTimeout = setTimeout(() => {
      setIsTailoring(false);
      setError(
        "⏱️ Resume tailoring took too long (2+ minutes).\n\nThis might be due to:\n• High API load\n• Poor internet connection\n• Job description too long\n\nPlease try:\n1. Shortening the job description\n2. Checking your internet connection\n3. Trying again in a few moments",
      );
    }, 120000);

    try {
      // Convert resume to string for API
      const resumeStr = JSON.stringify(masterResume);

      // Sequential calls to avoid hitting Gemini free-tier rate limit (5 RPM)
      const tailorResult = await apiClient.tailorResume(resumeStr, jobDescription);
      const parseResult = await apiClient.parseJob(jobDescription);
      const originalAtsResult = await apiClient.getATSScore(resumeStr, jobDescription);

      // tailorResult.estimatedATSScore is now cross-validated (scored on the TAILORED resume by the backend)
      const tailoredAtsScore: number = tailorResult.estimatedATSScore || 0;
      const originalAtsScore: number = originalAtsResult.atsScore || 0;

      // Map backend parse_job fields to frontend JobDescription type
      const jobData: JobDescription = {
        title: parseResult.jobTitle || '',
        company: parseResult.company || '',
        location: parseResult.location || '',
        description: parseResult.description || jobDescription.substring(0, 500),
        requirements: Array.isArray(parseResult.responsibilities)
          ? parseResult.responsibilities
          : (parseResult.preferredSkills || []),
        skills: parseResult.requiredSkills || [],
      };

      // Merge tailored sections from backend response into the master resume structure
      const tailored: ResumeData = {
        ...masterResume,
        summary: tailorResult.summary || masterResume.summary,
        skills:
          Array.isArray(tailorResult.skills) && tailorResult.skills.length > 0
            ? tailorResult.skills.filter((s: string) =>
                masterResume.skills.some(
                  (ms) => ms.toLowerCase() === s.toLowerCase(),
                ),
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
            description:
              t?.description?.length > 0 ? t.description : exp.description,
          };
        }),
        projects: masterResume.projects?.map((proj) => {
          const t = tailorResult.projects?.find(
            (tp: any) =>
              tp.title?.toLowerCase() === proj.title.toLowerCase(),
          );
          return {
            ...proj,
            description:
              t?.description?.trim() ? t.description : proj.description,
          };
        }),
      };

      clearTimeout(tailorTimeout);
      setTailorState({
        tailored,
        atsScore: tailoredAtsScore,
        originalAtsScore,
        jobData,
        scoreBreakdown: (tailorResult as any).scoreBreakdown || (originalAtsResult as any).scoreBreakdown || {},
        issueCount: ((originalAtsResult as any).improvements || []).length,
      });

      setMissingContentSections([]);
      setSuccess(`✅ Resume tailored! ATS Score improved from ${originalAtsScore}% → ${tailoredAtsScore}%`);
    } catch (err) {
      clearTimeout(tailorTimeout);
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes("Insufficient credits")) {
        setError(
          `💳 Insufficient credits:\n\n${errorMessage}\n\nPlease purchase more credits to continue.`,
        );
      } else if (errorMessage.includes("Unauthorized")) {
        setError(
          `🔐 Authentication error:\n\nPlease log in again to continue.`,
        );
      } else {
        setError(
          `❌ Tailoring failed:\n\n${errorMessage || "Unknown error occurred"}\n\nPlease try:\n1. Checking your internet connection\n2. Verifying the job description format\n3. Trying again in a moment`,
        );
      }
    } finally {
      setIsTailoring(false);
    }
  };

  const handleDownload = async () => {
    if (!tailorState.tailored || !tailorState.jobData) return;

    try {
      const blob = await generateResumeDocx(
        tailorState.tailored,
        tailorState.jobData.company,
        tailorState.jobData.title,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `Resume_${tailorState.jobData.company}_${tailorState.jobData.title}_${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("✓ Resume downloaded successfully!");
    } catch (err) {
      setError(
        `Download failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleOpenTemplateSelector = () => {
    if (tailorState.tailored && tailorState.jobData) {
      setShowTemplateSelector(true);
    }
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
      setSuccess(
        "✓ Application saved to history! View it in the History page.",
      );
    } catch (err) {
      setError(
        `Failed to save application: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <Page size="lg">
        <LoadingState
          title="Loading your resume"
          description="Retrieving your master resume…"
          className="max-w-xl"
        />
      </Page>
    );
  }

  if (!masterResume) {
    return (
      <Page size="md">
        <ErrorState
          title="No master resume found"
          description={error ?? "Please upload a master resume first."}
          className="max-w-xl"
        />
      </Page>
    );
  }

  return (
    <Page size="xl">
      {/* Template Selector Modal */}
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

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive whitespace-pre-wrap font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-600/10 border border-green-600/20 flex gap-3">
            <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 font-medium">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Master Resume Preview */}
          <PremiumCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Master Resume</h2>
              <Button
                onClick={() => setShowResume(!showResume)}
                variant="ghost"
                size="icon"
                className="rounded-xl"
              >
                {showResume ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>

            {showResume && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-base mb-2">
                    {masterResume.contact.name}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {masterResume.contact.email && (
                      <p>{masterResume.contact.email}</p>
                    )}
                    {masterResume.contact.phone && (
                      <p>{masterResume.contact.phone}</p>
                    )}
                    {masterResume.contact.location && (
                      <p>{masterResume.contact.location}</p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {masterResume.summary && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {masterResume.summary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {masterResume.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {masterResume.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {masterResume.experience.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Experience</h4>
                    <div className="space-y-2">
                      {masterResume.experience.map((exp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.company} • {exp.startDate}
                            {exp.endDate && ` - ${exp.endDate}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {masterResume.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Education</h4>
                    <div className="space-y-2">
                      {masterResume.education.map((edu, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">
                            {edu.degree} in {edu.field}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {edu.institution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {masterResume.certifications &&
                  masterResume.certifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Certifications
                      </h4>
                      <ul className="space-y-1">
                        {masterResume.certifications.map((cert, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            ✓ {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Achievements */}
                {masterResume.achievements &&
                  masterResume.achievements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Achievements
                      </h4>
                      <ul className="space-y-1">
                        {masterResume.achievements.map((achievement, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            🏆 {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Publications */}
                {masterResume.publications &&
                  masterResume.publications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Publications
                      </h4>
                      <ul className="space-y-1">
                        {masterResume.publications.map((publication, i) => {
                          const pubText =
                            typeof publication === "string"
                              ? publication
                              : publication &&
                                  typeof publication === "object" &&
                                  "title" in publication
                                ? (() => {
                                    const p = publication as any;
                                    return `${p.title}${p.publisher ? ` (${p.publisher})` : ""}${p.date ? ` - ${p.date}` : ""}`;
                                  })()
                                : String(publication);
                          return (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground"
                            >
                              📄 {pubText}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                {/* Hobbies */}
                {masterResume.hobbies && masterResume.hobbies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      Hobbies & Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {masterResume.hobbies.map((hobby, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showResume && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Resume details hidden</p>
                <button
                  onClick={() => setShowResume(true)}
                  className="text-primary hover:underline mt-2"
                >
                  Show resume
                </button>
              </div>
            )}
          </PremiumCard>

          {/* Right: Job Description Input and Tailoring */}
          <div className="space-y-6">
            {/* Job Description Input */}
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
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Tailoring your resume...
                  </>
                ) : (
                  <>Tailor resume</>
                )}
              </Button>

              {isTailoring && (
                <div className="mt-4 p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
                  <div className="flex items-start gap-3">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Processing your resume
                      </p>
                      <p className="text-xs text-blue-600/70 mt-1">
                        Analyzing job requirements and tailoring your resume for
                        maximum ATS compatibility...
                      </p>
                      <p className="text-xs text-blue-600/70 mt-2">
                        This may take 20-60 seconds depending on the job
                        description length.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </PremiumCard>

            {/* Results */}
            {tailorState.tailored && (
              <PremiumCard className="p-6" hover={false}>
                <h2 className="text-xl font-semibold mb-4">Results</h2>

                <div className="space-y-4">
                  {/* ── ATS Overview ─────────────────────────────────── */}
                  <div className="flex items-center gap-6">
                    {/* Semicircle gauge */}
                    <div className="relative flex-shrink-0" style={{ width: 140, height: 76 }}>
                      <svg viewBox="0 0 120 64" width="140" height="76">
                        <defs>
                          <linearGradient id="atsGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%"   stopColor="#ef4444"/>
                            <stop offset="40%"  stopColor="#f97316"/>
                            <stop offset="70%"  stopColor="#eab308"/>
                            <stop offset="100%" stopColor="#22c55e"/>
                          </linearGradient>
                        </defs>
                        {/* Track */}
                        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round"/>
                        {/* Score arc */}
                        <path d="M10,60 A50,50 0 0,1 110,60" fill="none"
                          stroke="url(#atsGrad)" strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${(tailorState.atsScore / 100) * 157} 157`}/>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ paddingBottom: 4 }}>
                        <span className="text-lg font-bold leading-none">{tailorState.atsScore}/100</span>
                        {tailorState.issueCount > 0 && (
                          <span className="text-xs text-muted-foreground">{tailorState.issueCount} Issues</span>
                        )}
                      </div>
                    </div>

                    {/* Before → After numbers */}
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Before</p>
                        <p className="text-2xl font-bold text-muted-foreground">{tailorState.originalAtsScore}%</p>
                      </div>
                      <span className="text-muted-foreground text-xl">→</span>
                      <div>
                        <p className="text-xs text-muted-foreground">After</p>
                        <p className="text-2xl font-bold text-primary">{tailorState.atsScore}%</p>
                      </div>
                      {tailorState.atsScore > tailorState.originalAtsScore && (
                        <span className="text-green-500 text-sm font-semibold self-end mb-1">
                          +{tailorState.atsScore - tailorState.originalAtsScore} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Score breakdown bars ──────────────────────────── */}
                  {Object.keys(tailorState.scoreBreakdown).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(tailorState.scoreBreakdown).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-20 capitalize">{key}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${val}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{val}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Job info ─────────────────────────────────────── */}
                  {tailorState.jobData && (tailorState.jobData.title || tailorState.jobData.company) && (
                    <div className="border-t border-border pt-3">
                      {tailorState.jobData.title && (
                        <p className="font-semibold text-sm">{tailorState.jobData.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {tailorState.jobData.company}
                        {tailorState.jobData.location && ` • ${tailorState.jobData.location}`}
                      </p>
                    </div>
                  )}

                  {tailorState.tailored.customSections &&
                    Object.keys(tailorState.tailored.customSections).length >
                      0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm font-semibold text-primary mb-2">
                          Custom Sections Generated:
                        </p>
                        <div className="space-y-2">
                          {Object.entries(
                            tailorState.tailored.customSections,
                          ).map(([sectionName, content]) => (
                            <div key={sectionName} className="text-xs">
                              <p className="font-medium text-foreground">
                                {sectionName}
                              </p>
                              <p className="text-muted-foreground line-clamp-2">
                                {content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleOpenTemplateSelector}
                      className="flex-1"
                      variant="gradient"
                    >
                      Choose template & download
                    </Button>
                    <Button
                      onClick={handleSaveApplication}
                      className="flex-1"
                      variant="outline"
                    >
                      Save to history
                    </Button>
                  </div>

                  <Button
                    onClick={() => {
                      setTailorState({
                        tailored: null,
                        atsScore: 0,
                        originalAtsScore: 0,
                        jobData: null,
                        scoreBreakdown: {},
                        issueCount: 0,
                      });
                      setJobDescription("");
                      setSuccess(null);
                      setMissingContentSections([]);
                    }}
                    className="w-full"
                    variant="secondary"
                  >
                    Tailor another
                  </Button>

                  {/* Missing Content Sections Warning */}
                  {missingContentSections.length > 0 && (
                    <div
                      className="missing-sections-warning"
                      style={{
                        background: "#fff3cd",
                        borderLeft: "4px solid #ffc107",
                        padding: "12px",
                        marginTop: "16px",
                        borderRadius: "4px",
                      }}
                    >
                      <strong style={{ color: "#856404" }}>
                        ⚠️ Some sections could not be processed:
                      </strong>
                      <ul
                        style={{
                          margin: "8px 0",
                          paddingLeft: "20px",
                          color: "#856404",
                        }}
                      >
                        {missingContentSections.map((section) => (
                          <li key={section}>
                            <strong>{section}:</strong> Not enough content in
                            your master resume
                          </li>
                        ))}
                      </ul>
                      <p
                        style={{
                          marginTop: "8px",
                          fontSize: "0.9em",
                          color: "#856404",
                        }}
                      >
                        💡{" "}
                        <em>
                          To include these sections, please update your master
                          resume with relevant content and re-upload.
                        </em>
                      </p>
                    </div>
                  )}
                </div>
              </PremiumCard>
            )}
          </div>
        </div>
    </Page>
  );
};
