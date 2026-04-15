import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimhaCLIStream } from "@/components/SimhaCLIStream";
import { getMasterResume } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

type Phase = "idle" | "generating" | "done" | "error";

export default function InterviewPrep() {
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [company, setCompany] = React.useState(searchParams.get("company") || "");
  const [jobTitle, setJobTitle] = React.useState(searchParams.get("title") || "");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [streamUrl, setStreamUrl] = React.useState("");
  const [markdownContent, setMarkdownContent] = React.useState("");
  const [recentApps, setRecentApps] = React.useState<any[]>([]);
  const [showApps, setShowApps] = React.useState(false);

  React.useEffect(() => {
    // Load recent applications so user can pick one
    apiClient.request("/api/applications", { method: "GET" })
      .then((res) => setRecentApps((res.applications || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!company.trim() || !jobTitle.trim()) {
      toast.error("Enter company name and job title");
      return;
    }

    const resume = await getMasterResume();
    try {
      setPhase("generating");
      const res = await apiClient.request("/api/interview/prep", {
        method: "POST",
        body: JSON.stringify({
          company: company.trim(),
          jobTitle: jobTitle.trim(),
          matchedKeywords: [],
          resumeSummary: resume?.summary || "",
          resumeSkills: resume?.skills || [],
        }),
      });
      const id = res.job_id;
      setJobId(id);
      setStreamUrl(`${API_BASE}/api/interview/stream/${id}`);
    } catch {
      setPhase("error");
      toast.error("Failed to start interview prep");
    }
  };

  const handleStreamComplete = async (output: string) => {
    setPhase("done");
    // Try to get the clean markdown from backend
    if (jobId) {
      try {
        const res = await apiClient.request(`/api/interview/result/${jobId}`, { method: "GET" });
        if (res?.content) {
          setMarkdownContent(res.content);
          return;
        }
      } catch {}
    }
    // Fallback: use raw output
    setMarkdownContent(output);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-prep-${company.replace(/\s+/g, "-")}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const pickApplication = (app: any) => {
    setCompany(app.company || "");
    setJobTitle(app.jobTitle || "");
    setShowApps(false);
  };

  // Simple markdown renderer (headings, bold, lists)
  const renderMarkdown = (md: string) => {
    const lines = md.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-6 mb-2 text-primary">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-black mt-6 mb-3">{line.slice(2)}</h1>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold mt-3 mb-1">{line.slice(2, -2)}</p>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 text-sm text-muted-foreground list-disc">{line.slice(2)}</li>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm">{line}</p>;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Interview Prep
        </h1>
        <p className="text-sm text-muted-foreground">
          Get 20 personalised interview Q&amp;A for any company + role — powered by SimhaCLI web research.
        </p>
      </div>

      {phase === "idle" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {/* Pick from recent applications */}
          {recentApps.length > 0 && (
            <div>
              <button
                onClick={() => setShowApps(!showApps)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {showApps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Pick from recent applications
              </button>
              {showApps && (
                <div className="mt-2 space-y-1">
                  {recentApps.map((app) => (
                    <button
                      key={app._id || app.id}
                      onClick={() => pickApplication(app)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-muted transition-colors border border-border"
                    >
                      <span className="font-medium">{app.jobTitle}</span>
                      <span className="text-muted-foreground ml-2">@ {app.company}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title</label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>

          <Button onClick={handleStart} disabled={!company.trim() || !jobTitle.trim()} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            Generate 20 Interview Q&amp;A
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            SimhaCLI researches the company, your background, and generates personalised questions with model answers.
          </p>
        </div>
      )}

      {phase === "generating" && jobId && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <p className="text-sm font-medium">
              SimhaCLI is researching {company} and generating your Q&amp;A…
            </p>
          </div>
          <p className="text-xs text-muted-foreground">This takes 60–90 seconds.</p>
          <SimhaCLIStream url={streamUrl} onComplete={handleStreamComplete} height={240} />
        </div>
      )}

      {phase === "done" && markdownContent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">
              ✓ 20 questions ready for <strong>{company}</strong> — <strong>{jobTitle}</strong>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download .md
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                Print / PDF
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-1 print:shadow-none">
            {renderMarkdown(markdownContent)}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setPhase("idle"); setMarkdownContent(""); setJobId(null); }}
          >
            ← Prep for another role
          </Button>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to generate. Make sure SimhaCLI is installed: <code>pip install simhacli</code>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPhase("idle")}>Try Again</Button>
        </div>
      )}
    </div>
  );
}
