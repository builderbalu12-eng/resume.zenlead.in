import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, Sparkles, Briefcase, Target, Download, History, Settings as SettingsIcon, CheckCircle2, Info, ChevronRight, Zap } from "lucide-react";
import { ResumeData, JobDescription } from "@/types";
import {
  getMasterResume,
  getApiKeyFromSettings,
  getSettings,
} from "@/utils/storage";
import { Settings } from "@/components/Settings";
import { TemplateSelector } from "@/components/TemplateSelector";
import {
  tailorResumeForJob,
  calculateATSScore,
  extractJobRequirements,
} from "@/services/gemini";
import { generateResumeDocx } from "@/services/resumeGenerator";
import { saveApplication } from "@/services/mongodb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const TailorResume: React.FC = () => {
  const navigate = useNavigate();
  const [masterResume, setMasterResume] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showResume, setShowResume] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [missingContentSections, setMissingContentSections] = useState<
    string[]
  >([]);

  const [tailorState, setTailorState] = useState<{
    tailored: ResumeData | null;
    atsScore: number;
    jobData: JobDescription | null;
  }>({
    tailored: null,
    atsScore: 0,
    jobData: null,
  });
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

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
        const apiKey = await getApiKeyFromSettings();
        setHasApiKey(!!apiKey);
      } catch (err) {
        setError("Failed to load master resume.");
      } finally {
        setIsLoading(false);
      }
    };
    loadResume();
  }, [navigate]);

  useEffect(() => {
    const handleResumeUpdate = async () => {
      const resume = await getMasterResume();
      if (resume) setMasterResume(resume);
    };
    window.addEventListener("storage", handleResumeUpdate);
    return () => window.removeEventListener("storage", handleResumeUpdate);
  }, []);

  useEffect(() => {
    if (masterResume) {
      setTailorState({ tailored: null, atsScore: 0, jobData: null });
      setJobDescription("");
      setSuccess(null);
      setError(null);
      setMissingContentSections([]);
    }
  }, [masterResume?.contact.name]);

  const checkMissingContentSections = (
    tailored: ResumeData,
    configuredSections: string[],
  ): string[] => {
    const missing: string[] = [];
    for (const section of configuredSections) {
      const sectionKey = section.charAt(0).toLowerCase() + section.slice(1).replace(/ /g, "");
      const sectionValue = (tailored as any)[sectionKey];
      let isEmpty = !sectionValue;
      if (!isEmpty && Array.isArray(sectionValue)) {
        isEmpty = sectionValue.length === 0 || sectionValue.every((item: any) => typeof item === "string" && item.trim().length < 20);
      } else if (!isEmpty && typeof sectionValue === "string") {
        isEmpty = sectionValue.trim().length < 20 || sectionValue.includes("N/A");
      }
      if (isEmpty) missing.push(section);
    }
    return missing;
  };

  const handleTailor = async () => {
    if (!masterResume || !jobDescription.trim()) {
      setError("❌ Please enter a job description before tailoring");
      return;
    }
    if (!hasApiKey) {
      setError("🔑 API Key Required. Please configure in Settings.");
      setShowSettings(true);
      return;
    }

    setIsTailoring(true);
    setError(null);
    setSuccess(null);
    setMissingContentSections([]);

    const tailorTimeout = setTimeout(() => {
      setIsTailoring(false);
      setError("⏱️ Tailoring took too long. Please try again with a shorter description.");
    }, 120000);

    try {
      const extracted = await extractJobRequirements(jobDescription);
      const appSettings = await getSettings();
      const configuredSections = appSettings?.resumeContentSections || [];
      const tailored = await tailorResumeForJob(masterResume, extracted, configuredSections);
      const atsData = calculateATSScore(tailored, extracted);
      const missing = checkMissingContentSections(tailored, configuredSections);

      clearTimeout(tailorTimeout);
      setTailorState({ tailored, atsScore: atsData.score, jobData: extracted });
      setMissingContentSections(missing);
      setSuccess(`✅ Resume tailored! ATS Score: ${atsData.score}%`);
    } catch (err) {
      clearTimeout(tailorTimeout);
      setError(`❌ Tailoring failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsTailoring(false);
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
      setSuccess("✓ Application saved to history!");
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 rounded-full animate-spin border-t-cyan-500" />
            <Loader2 className="h-10 w-10 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Initializing AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      {showTemplateSelector && tailorState.tailored && tailorState.jobData && (
        <TemplateSelector
          resume={tailorState.tailored}
          jobData={tailorState.jobData}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black transition-all uppercase tracking-widest text-xs"
            >
               <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
                 <ArrowLeft className="h-4 w-4" />
               </div>
               Dashboard
            </button>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              Tailor <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Resume</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Transform your master resume into a job-winning application with AI.
            </p>
          </div>
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            className="rounded-2xl border-2 py-6 px-6 font-black uppercase tracking-widest text-xs flex items-center gap-2"
          >
            <SettingsIcon className="h-4 w-4" /> Configuration
          </Button>
        </div>

        {/* Notifications */}
        {(error || success) && (
          <div className="mb-12 animate-in slide-in-from-top-4 duration-300">
            {error && (
              <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl flex items-center gap-4">
                <div className="bg-rose-500 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-rose-700 dark:text-rose-400 font-black text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-2xl flex items-center gap-4">
                <div className="bg-emerald-500 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <p className="text-emerald-700 dark:text-emerald-400 font-black text-sm">{success}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left: Master Resume & Input */}
          <div className="lg:col-span-7 space-y-10">
            {/* JD Input */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-cyan-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Job Description</h2>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required</span>
               </div>
               
               <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here. Our AI will analyze the keywords, requirements, and tone to perfectly match your resume."
                className="w-full h-[350px] p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm resize-none focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400 leading-relaxed"
              />

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleTailor}
                  disabled={isTailoring || !jobDescription.trim() || !hasApiKey}
                  className="flex-1 py-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg group shadow-2xl"
                >
                  {isTailoring ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Optimizing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Tailor Resume</span>
                      <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </div>
                  )}
                </Button>
                {tailorState.tailored && (
                  <Button
                    onClick={() => {
                      setTailorState({ tailored: null, atsScore: 0, jobData: null });
                      setJobDescription("");
                    }}
                    variant="outline"
                    className="py-8 px-10 rounded-2xl border-2 font-black uppercase tracking-widest text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Master Resume Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Briefcase className="h-32 w-32" />
              </div>
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Master Profile</h2>
                  </div>
                  <button
                    onClick={() => setShowResume(!showResume)}
                    className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:underline"
                  >
                    {showResume ? 'Collapse View' : 'Expand View'}
                  </button>
               </div>

               {showResume && masterResume && (
                 <div className="space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                    <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{masterResume.contact.name}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{masterResume.contact.email} • {masterResume.contact.location}</p>
                    </div>
                    {masterResume.summary && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Summary</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{masterResume.summary}</p>
                      </div>
                    )}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Core Skills</p>
                       <div className="flex flex-wrap gap-2">
                         {masterResume.skills.map((s, i) => (
                           <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase border border-slate-100 dark:border-slate-700">
                             {s}
                           </span>
                         ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* Right: Results & Controls */}
          <div className="lg:col-span-5 space-y-10">
            {tailorState.tailored ? (
              <div className="bg-slate-900 dark:bg-white rounded-[2.5rem] p-10 shadow-2xl text-white dark:text-slate-900 space-y-10 animate-in zoom-in-95 duration-500">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Match Quality</p>
                      <h3 className="text-3xl font-black tracking-tight">ATS Analysis</h3>
                    </div>
                    <div className="h-20 w-20 rounded-full border-4 border-slate-800 dark:border-slate-100 flex items-center justify-center relative">
                      <span className="text-2xl font-black">{tailorState.atsScore}%</span>
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin-slow opacity-50" />
                    </div>
                  </div>

                  {tailorState.jobData && (
                    <div className="p-6 bg-white/5 dark:bg-slate-50 rounded-3xl border border-white/10 dark:border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Role</p>
                      <h4 className="text-xl font-black tracking-tight">{tailorState.jobData.title}</h4>
                      <p className="text-sm font-bold text-cyan-400 dark:text-cyan-600 mt-1">{tailorState.jobData.company}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => setShowTemplateSelector(true)}
                    className="w-full py-8 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-lg shadow-xl shadow-cyan-500/20 flex items-center gap-3 group"
                  >
                    <span>Download DOCX</span>
                    <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
                  </Button>
                  <Button
                    onClick={handleSaveApplication}
                    variant="outline"
                    className="w-full py-8 rounded-2xl border-2 border-slate-700 dark:border-slate-200 text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest flex items-center gap-3"
                  >
                    <History className="h-4 w-4" /> Save to History
                  </Button>
                </div>

                <div className="pt-8 border-t border-slate-800 dark:border-slate-200 space-y-4">
                   <div className="flex items-start gap-4">
                     <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                       <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Keywords perfectly aligned with JD</p>
                   </div>
                   <div className="flex items-start gap-4">
                     <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                       <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Structure optimized for ATS parsers</p>
                   </div>
                </div>

                {missingContentSections.length > 0 && (
                  <div className="p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-amber-500" />
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Partial Processing</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      AI could not find enough data in your master resume for: <span className="text-amber-500">{missingContentSections.join(', ')}</span>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8">
                 <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                   <Zap className="h-10 w-10 text-slate-200" />
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Advantage</h3>
                   <p className="text-slate-500 font-medium leading-relaxed">
                     Paste a job description to unlock your personalized ATS analysis and download your tailored resume in seconds.
                   </p>
                 </div>
                 <div className="space-y-4">
                   {[
                     "Keyword extraction",
                     "Tone adjustment",
                     "Skill highlighting",
                     "ATS compatibility check"
                   ].map((tip, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <ChevronRight className="h-4 w-4 text-cyan-500" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{tip}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-200 dark:border-slate-800">
               <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Need help?</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-left hover:border-cyan-500 border border-transparent transition-all">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase mb-1">Guide</p>
                    <p className="text-[10px] text-slate-400 font-bold">How to tailor</p>
                  </button>
                  <button className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-left hover:border-cyan-500 border border-transparent transition-all">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase mb-1">Support</p>
                    <p className="text-[10px] text-slate-400 font-bold">Contact us</p>
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
