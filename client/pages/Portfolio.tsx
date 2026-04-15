import * as React from "react";
import { Globe, Rocket, RefreshCw, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimhaCLIStream } from "@/components/SimhaCLIStream";
import { getMasterResume } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

type Phase = "idle" | "generating" | "done" | "error";

export default function Portfolio() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = React.useState<string | null>(null);
  const [existingUrl, setExistingUrl] = React.useState<string | null>(null);
  const [hasResume, setHasResume] = React.useState(false);
  const [streamUrl, setStreamUrl] = React.useState("");

  // Load existing portfolio URL and check for resume
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.request("/api/portfolio/status", { method: "GET" });
        if (res?.portfolio?.url) setExistingUrl(res.portfolio.url);
      } catch {}
      const resume = await getMasterResume();
      setHasResume(!!resume);
    };
    load();
  }, []);

  const handleGenerate = async () => {
    const resume = await getMasterResume();
    if (!resume) {
      toast.error("Upload your resume first in the Resume tab");
      return;
    }

    try {
      setPhase("generating");
      const res = await apiClient.request("/api/portfolio/generate", {
        method: "POST",
        body: JSON.stringify({ resume }),
      });
      const id = res.job_id;
      setJobId(id);
      setStreamUrl(`${API_BASE}/api/portfolio/stream/${id}`);
    } catch (e) {
      setPhase("error");
      toast.error("Failed to start portfolio generation");
    }
  };

  const handleStreamComplete = async (output: string) => {
    setPhase("done");
    // Extract Vercel URL from output
    const match = output.match(/https:\/\/[^\s]+\.vercel\.app[^\s]*/g);
    const url = match ? match[match.length - 1] : null;
    if (url) {
      setDeployedUrl(url);
      setExistingUrl(url);
      // Save to backend
      try {
        await apiClient.request("/api/portfolio/save-url", {
          method: "POST",
          body: JSON.stringify({ url }),
        });
        toast.success("Portfolio deployed and saved!");
      } catch {}
    } else {
      toast.warning("Generation complete but no Vercel URL detected. Check the log.");
    }
  };

  const handleUrlDetected = (url: string) => {
    setDeployedUrl(url);
    setExistingUrl(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Portfolio Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate and deploy a professional portfolio website from your resume — powered by SimhaCLI.
        </p>
      </div>

      {/* Existing portfolio */}
      {existingUrl && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              ✓ Portfolio Live
            </p>
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
            >
              {existingUrl} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={phase === "generating"}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </Button>
        </div>
      )}

      {/* No resume warning */}
      {!hasResume && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400">
          ⚠ No resume uploaded yet. Go to the{" "}
          <a href="/resume" className="underline font-medium">Resume tab</a>{" "}
          to upload your master resume first.
        </div>
      )}

      {/* Generate button */}
      {phase === "idle" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold">What you get</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>🎨 Hero section with your name, title, and contact links</li>
              <li>💼 Experience timeline from your work history</li>
              <li>🚀 Project cards with tech stack badges</li>
              <li>⚡ Skills cloud ordered by relevance</li>
              <li>📧 Contact section</li>
              <li>🌐 Deployed live on Vercel in ~60 seconds</li>
            </ul>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!hasResume}
            className="w-full"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {existingUrl ? "Regenerate Portfolio" : "Generate Portfolio"}
          </Button>
        </div>
      )}

      {/* Generating — live stream */}
      {phase === "generating" && jobId && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium">SimhaCLI is building your portfolio…</p>
          </div>
          <SimhaCLIStream
            url={streamUrl}
            onComplete={handleStreamComplete}
            onUrl={handleUrlDetected}
            height={280}
          />
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="font-bold text-lg">Portfolio Generated!</h2>
          {deployedUrl ? (
            <>
              <p className="text-sm text-muted-foreground">Your portfolio is live at:</p>
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline flex items-center justify-center gap-1"
              >
                {deployedUrl} <ExternalLink className="h-4 w-4" />
              </a>
              <Button asChild>
                <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                  Visit Portfolio ↗
                </a>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generation complete. Check the log above for the deployed URL.
            </p>
          )}
          <Button variant="outline" onClick={() => { setPhase("idle"); setJobId(null); }}>
            Generate Again
          </Button>
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Generation failed. Make sure SimhaCLI is installed on the server:
          <code className="block mt-1 bg-black/10 rounded px-2 py-1">pip install simhacli && npm install -g vercel</code>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPhase("idle")}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
