import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { apiClient } from "@/services/api";
import { Input } from "@/components/ui/input";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Settings } from "@/components/Settings";
import { ResumeData } from "@/types";
import { Page } from "@/components/layout/Page";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { SectionHeader } from "@/components/premium/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  setMasterResume,
  setUserId,
  forceSyncMasterResume,
} from "@/utils/storage";
import { saveResume } from "@/services/mongodb";

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioSaved, setPortfolioSaved] = useState(false);

  const handleSavePortfolio = async () => {
    if (!portfolioUrl.trim()) return;
    setSavingPortfolio(true);
    try {
      await apiClient.updateCurrentUser({ portfolio_url: portfolioUrl.trim() } as any);
      setPortfolioSaved(true);
      setTimeout(() => setPortfolioSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleUploadSuccess = async (uploadedResume: ResumeData) => {
    setIsLoading(true);
    setError(null);

    // Add timeout to prevent hanging (30 seconds)
    const saveTimeout = setTimeout(() => {
      setIsLoading(false);
      setError(
        "⏱️ Saving took too long. Your resume was processed, but failed to save to database. It's saved locally.\n\nYou can still proceed to tailor your resume.",
      );
    }, 30000);

    try {
      // Generate a unique user ID if not exists
      const userId = `user_${Date.now()}`;
      await setUserId(userId);

      // Save to local storage with force sync to ensure chrome extension gets updated
      console.log(
        "[UploadResume] Saving resume to storage:",
        uploadedResume.contact.name,
      );
      await forceSyncMasterResume(uploadedResume);
      console.log(
        "[UploadResume] Resume saved successfully to all storage locations",
      );

      // Notify Chrome extension that resume has been updated
      // This will cause the extension popup to refresh its cached data
      try {
        // Method 1: If we have chrome.runtime access (e.g., in extension context)
        if (typeof chrome !== "undefined" && chrome.runtime) {
          try {
            console.log(
              "[UploadResume] Attempting to notify extension via chrome.runtime",
            );
            chrome.runtime.sendMessage(
              {
                action: "resumeUpdated",
                resume: uploadedResume,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  // Extension context may not be available, that's OK
                  console.warn(
                    "[UploadResume] Could not notify extension via chrome.runtime:",
                    chrome.runtime.lastError.message,
                  );
                } else {
                  console.log(
                    "[UploadResume] ✓ Extension notified via chrome.runtime",
                  );
                }
              },
            );
          } catch (e) {
            console.warn(
              "[UploadResume] Error using chrome.runtime.sendMessage:",
              e,
            );
          }
        }

        // Method 2: Send via window.postMessage so content script can relay it
        console.log(
          "[UploadResume] Posting resume update to content script via window.postMessage",
        );
        window.postMessage(
          {
            source: "resumematch-web-app",
            action: "resumeUpdated",
            resume: uploadedResume,
          },
          "*",
        );
        console.log("[UploadResume] ✓ Resume update posted to content script");
      } catch (e) {
        console.warn("[UploadResume] Error notifying extension:", e);
      }

      // Save resume data
      try {
        await saveResume(uploadedResume);
      } catch (e) {
        console.warn("Could not save resume to database:", e);
        // Continue anyway, data is in local storage
      }

      clearTimeout(saveTimeout);
      setResume(uploadedResume);
      if (uploadedResume.contact.website) setPortfolioUrl(uploadedResume.contact.website);
    } catch (err) {
      clearTimeout(saveTimeout);
      setError(
        "❌ Failed to process resume. Please try uploading again.\n\nMake sure your resume:\n• Contains valid contact information\n• Has at least one job experience\n• Includes education details",
      );
      console.error("Error saving resume:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (resume) {
    return (
      <Page size="md">
        <PremiumCard className="p-8" hover={false}>
          <div className="text-center">
            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-green-600/10 border border-green-600/20">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
              Resume uploaded
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Your master resume is saved and ready to tailor for job applications.
            </p>

            <PremiumCard className="p-6 text-left space-y-6 max-h-[560px] overflow-y-auto" hover={false}>
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-base mb-2">
                  {resume.contact.name}
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  {resume.contact.email && <p>📧 {resume.contact.email}</p>}
                  {resume.contact.phone && <p>📞 {resume.contact.phone}</p>}
                  {resume.contact.location && (
                    <p>📍 {resume.contact.location}</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Professional Summary
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {resume.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Skills ({resume.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, i) => (
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
              {resume.experience.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Experience ({resume.experience.length})
                  </h4>
                  <div className="space-y-2">
                    {resume.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="text-sm border-l-2 border-primary pl-3"
                      >
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
              {resume.education.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Education ({resume.education.length})
                  </h4>
                  <div className="space-y-2">
                    {resume.education.map((edu, i) => (
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
              {resume.certifications && resume.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Certifications ({resume.certifications.length})
                  </h4>
                  <ul className="space-y-1">
                    {resume.certifications.map((cert, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        ✓ {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements */}
              {resume.achievements && resume.achievements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Achievements ({resume.achievements.length})
                  </h4>
                  <ul className="space-y-1">
                    {resume.achievements.map((achievement, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        🏆 {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Publications */}
              {resume.publications && resume.publications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Publications ({resume.publications.length})
                  </h4>
                  <ul className="space-y-1">
                    {resume.publications.map((publication, i) => {
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
                        <li key={i} className="text-sm text-muted-foreground">
                          📄 {pubText}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Hobbies */}
              {resume.hobbies && resume.hobbies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Hobbies & Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.hobbies.map((hobby, i) => (
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
            </PremiumCard>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="gradient" onClick={() => navigate("/tailor")}>
                Tailor resume
              </Button>
              <Button variant="outline" onClick={() => setResume(null)}>
                Upload new
              </Button>
              <Button variant="secondary" onClick={() => navigate("/")}>
                Dashboard
              </Button>
            </div>

            {/* Portfolio URL capture */}
            <div className="mt-6 rounded-xl border border-border/40 bg-muted/20 p-4 text-left space-y-3">
              <div>
                <p className="text-sm font-medium">Portfolio / Website</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add your portfolio link — it'll show on your freelancer profile and be searchable via Nova.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="flex-1 text-sm"
                />
                <Button size="sm" onClick={handleSavePortfolio} disabled={savingPortfolio || !portfolioUrl.trim()}>
                  {savingPortfolio ? 'Saving…' : 'Save'}
                </Button>
              </div>
              {portfolioSaved && <p className="text-xs text-green-600">Saved ✓</p>}
            </div>
          </div>
        </PremiumCard>
      </Page>
    );
  }

  return (
    <Page size="md">
      <div className="mb-8">
        <SectionHeader
          title="Upload your master resume"
          description="Upload a DOCX resume once. We’ll parse it and use it to tailor resumes for job applications."
        />
      </div>

      <PremiumCard className="p-6 sm:p-8 mb-8" hover={false}>
          <ResumeUpload
            onUploadSuccess={handleUploadSuccess}
            isLoading={isLoading}
            onApiKeyMissing={() => setShowSettings(true)}
          />

          {/* Settings Modal */}
          <Settings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />

          {error && (
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
      </PremiumCard>

      <div className="grid md:grid-cols-2 gap-6">
        <PremiumCard className="p-6" hover={false}>
          <h3 className="font-semibold mb-3">Resume requirements</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ DOCX format (.docx file)</li>
              <li>✓ Contact information</li>
              <li>✓ Professional summary or objective</li>
              <li>✓ Skills section</li>
              <li>✓ Work experience</li>
              <li>✓ Education</li>
          </ul>
        </PremiumCard>

        <PremiumCard className="p-6" hover={false}>
          <h3 className="font-semibold mb-3">Tips for best results</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use clear section headers</li>
              <li>• Include quantifiable achievements</li>
              <li>• List relevant technical skills</li>
              <li>• Keep formatting simple</li>
              <li>• Proofread for typos</li>
              <li>• Update with recent experience</li>
          </ul>
        </PremiumCard>
      </div>
    </Page>
  );
};
