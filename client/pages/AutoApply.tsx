import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimhaCLIStream } from "@/components/SimhaCLIStream";
import { getMasterResume } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

type Phase = "idle" | "applying" | "done" | "error";

export default function AutoApply() {
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [jobUrl, setJobUrl] = React.useState(
    () => searchParams.get("jobUrl") || ""
  );
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [coverLetter, setCoverLetter] = React.useState("");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [streamUrl, setStreamUrl] = React.useState("");
  const [finalOutput, setFinalOutput] = React.useState("");

  // Pre-fill from resume
  React.useEffect(() => {
    getMasterResume().then((resume) => {
      if (!resume) return;
      const c = resume.contact || ({} as any);
      setName(c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "");
      setEmail(c.email || "");
      setPhone(c.phone || "");
    });
  }, []);

  const handleApply = async () => {
    if (!jobUrl.trim() || !email.trim()) {
      toast.error("Job URL and email are required");
      return;
    }

    const confirmed = window.confirm(
      `Auto-apply to:\n${jobUrl}\n\nSimhaCLI will use Playwright to fill and submit the application form. Continue?`
    );
    if (!confirmed) return;

    try {
      setPhase("applying");
      const res = await apiClient.request("/api/autoapply/start", {
        method: "POST",
        body: JSON.stringify({
          jobUrl: jobUrl.trim(),
          name,
          email,
          phone,
          coverLetter,
        }),
      });
      const id = res.job_id;
      setJobId(id);
      setStreamUrl(`${API_BASE}/api/autoapply/stream/${id}`);
    } catch {
      setPhase("error");
      toast.error("Failed to start auto-apply");
    }
  };

  const handleStreamComplete = (output: string) => {
    setPhase("done");
    setFinalOutput(output);
  };

  const isSuccess =
    finalOutput.includes("submitted") ||
    finalOutput.includes("Submitted") ||
    finalOutput.includes("success") ||
    finalOutput.includes("confirmation");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Auto Apply
        </h1>
        <p className="text-sm text-muted-foreground">
          Let SimhaCLI + Playwright fill and submit job application forms automatically.
        </p>
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-sm text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          This feature requires <strong>Playwright MCP</strong> configured in SimhaCLI on the server.
          Works best on simple job boards. Some sites may block automation.
        </p>
      </div>

      {phase === "idle" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Job URL *</label>
            <Input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://jobs.example.com/apply/12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Balakrishna Akula" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Cover Letter / Message (optional)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              placeholder="Write a brief cover letter or leave blank..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button onClick={handleApply} disabled={!jobUrl.trim() || !email.trim()} className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            Start Auto Apply
          </Button>
        </div>
      )}

      {phase === "applying" && jobId && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary animate-spin" />
            <p className="text-sm font-medium">SimhaCLI is filling your application…</p>
          </div>
          <p className="text-xs text-muted-foreground">Each step is shown below in real time.</p>
          <SimhaCLIStream url={streamUrl} onComplete={handleStreamComplete} height={260} />
        </div>
      )}

      {phase === "done" && (
        <div
          className={`rounded-xl border p-6 space-y-3 ${
            isSuccess
              ? "border-green-500/30 bg-green-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`h-5 w-5 ${isSuccess ? "text-green-500" : "text-amber-500"}`}
            />
            <h2 className="font-semibold">
              {isSuccess ? "Application Submitted!" : "Process Complete"}
            </h2>
          </div>
          {!isSuccess && (
            <p className="text-sm text-muted-foreground">
              Check the log — the form may require manual steps (login, CAPTCHA, or file upload).
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPhase("idle"); setJobId(null); setFinalOutput(""); }}
          >
            Apply to Another Job
          </Button>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to start. Make sure SimhaCLI + Playwright MCP is configured on the server.
          <Button variant="outline" size="sm" className="mt-3 block" onClick={() => setPhase("idle")}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
