import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Upload, FileText, Info, Sparkles, User, Mail, MapPin, Phone, Briefcase, GraduationCap, Award, BookOpen, Heart, ArrowRight } from "lucide-react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Settings } from "@/components/Settings";
import { ResumeData } from "@/types";
import {
  setMasterResume,
  setUserId,
  forceSyncMasterResume,
} from "@/utils/storage";
import { saveResume } from "@/services/mongodb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleUploadSuccess = async (uploadedResume: ResumeData) => {
    setIsLoading(true);
    setError(null);

    const saveTimeout = setTimeout(() => {
      setIsLoading(false);
      setError(
        "⏱️ Saving took too long. Your resume was processed, but failed to save to database. It's saved locally.",
      );
    }, 30000);

    try {
      const userId = `user_${Date.now()}`;
      await setUserId(userId);
      await forceSyncMasterResume(uploadedResume);

      try {
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage({ action: "resumeUpdated", resume: uploadedResume });
        }
        window.postMessage({ source: "resumematch-web-app", action: "resumeUpdated", resume: uploadedResume }, "*");
      } catch (e) {
        console.warn("[UploadResume] Error notifying extension:", e);
      }

      try {
        await saveResume(uploadedResume);
      } catch (e) {
        console.warn("Could not save resume to database:", e);
      }

      clearTimeout(saveTimeout);
      setResume(uploadedResume);
    } catch (err) {
      clearTimeout(saveTimeout);
      setError(
        "❌ Failed to process resume. Please try uploading again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (resume) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate("/")}
            className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black mb-12 transition-all uppercase tracking-widest text-xs"
          >
             <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
               <ArrowLeft className="h-4 w-4" />
             </div>
             Dashboard
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <CheckCircle className="h-64 w-64 text-emerald-500" />
            </div>

            <div className="relative z-10 text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles className="h-3 w-3" />
                Success!
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                Resume Analyzed
              </h1>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">
                We've successfully parsed your resume. It's now optimized and ready for tailoring.
              </p>
            </div>

            <div className="grid md:grid-cols-12 gap-10">
              {/* Preview Content */}
              <div className="md:col-span-8 space-y-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 max-h-[700px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-10">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-700">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">{resume.contact.name}</h2>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                          {resume.contact.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-cyan-500" /> {resume.contact.email}</div>}
                          {resume.contact.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-cyan-500" /> {resume.contact.phone}</div>}
                          {resume.contact.location && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-cyan-500" /> {resume.contact.location}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-10">
                      {resume.summary && (
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                             <FileText className="h-4 w-4 text-cyan-500" /> Professional Summary
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                            {resume.summary}
                          </p>
                        </div>
                      )}

                      {resume.skills.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                             <Sparkles className="h-4 w-4 text-cyan-500" /> Core Competencies
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {resume.skills.map((skill, i) => (
                              <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.experience.length > 0 && (
                        <div className="space-y-6">
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                             <Briefcase className="h-4 w-4 text-cyan-500" /> Work History
                          </h4>
                          <div className="space-y-6">
                            {resume.experience.map((exp, i) => (
                              <div key={i} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700">
                                <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                <div className="space-y-1">
                                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{exp.title}</p>
                                  <p className="text-xs font-bold text-slate-500">{exp.company} • {exp.startDate} {exp.endDate && `- ${exp.endDate}`}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Sidebar */}
              <div className="md:col-span-4 space-y-6">
                <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 text-white dark:text-slate-900 space-y-8 shadow-xl">
                   <h3 className="text-xl font-black uppercase tracking-tight">Next Steps</h3>
                   <div className="space-y-4">
                     <Button
                        onClick={() => navigate("/tailor")}
                        className="w-full py-7 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-base shadow-lg shadow-cyan-500/20 group transition-all"
                      >
                        <div className="flex items-center gap-2">
                          Tailor Resume <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                      <Button
                        onClick={() => setResume(null)}
                        variant="outline"
                        className="w-full py-7 rounded-2xl border-2 border-slate-700 dark:border-slate-200 text-white dark:text-slate-900 font-black text-base hover:bg-slate-800 dark:hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          Upload New <Upload className="h-4 w-4" />
                        </div>
                      </Button>
                   </div>
                   <div className="pt-6 border-t border-slate-800 dark:border-slate-200 space-y-4">
                     <div className="flex items-center gap-3">
                       <CheckCircle className="h-4 w-4 text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parsing complete</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <CheckCircle className="h-4 w-4 text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ATS Optimized</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-black mb-12 transition-all uppercase tracking-widest text-xs"
        >
           <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-cyan-50 group-hover:border-cyan-200 transition-all">
             <ArrowLeft className="h-4 w-4" />
           </div>
           Dashboard
        </button>

        <div className="mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest">
            Step 1: Data Input
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Upload Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Master Resume</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Upload your professional resume as a DOCX file. Our AI will extract your core skills and experience to build your master profile.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-12 shadow-2xl border border-slate-200 dark:border-slate-800 mb-12">
          <ResumeUpload
            onUploadSuccess={handleUploadSuccess}
            isLoading={isLoading}
            onApiKeyMissing={() => setShowSettings(true)}
          />

          <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

          {error && (
            <div className="mt-8 p-6 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500 p-2 rounded-full shadow-lg">
                  <Info className="h-4 w-4 text-white" />
                </div>
                <p className="text-rose-700 dark:text-rose-400 text-sm font-black">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
               <FileText className="h-5 w-5 text-cyan-500" /> Requirements
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Format", value: "DOCX / Word File" },
                { label: "Content", value: "Experience & Education" },
                { label: "Contact", value: "Email & Phone" },
                { label: "Metadata", value: "Skills & Summary" }
              ].map((req, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{req.label}</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{req.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="h-20 w-20 text-cyan-400" />
            </div>
            <h3 className="text-sm font-black text-white dark:text-slate-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
               <Info className="h-5 w-5 text-cyan-400" /> Expert Tips
            </h3>
            <ul className="space-y-4">
              {[
                "Use clear section headers",
                "Include quantifiable achievements",
                "List specific technical tools",
                "Keep formatting clean and simple"
              ].map((tip, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="h-6 w-6 rounded-lg bg-white/10 dark:bg-slate-900/10 flex items-center justify-center border border-white/20 dark:border-slate-900/20 group-hover:bg-cyan-500/20 transition-all">
                    <CheckCircle className="h-3 w-3 text-cyan-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
