import * as React from "react";
import { Github, RefreshCw, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimhaCLIStream } from "@/components/SimhaCLIStream";
import { getMasterResume } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

type Phase = "idle" | "syncing" | "done";

interface Suggestion {
  _id: string;
  type: "new_project" | "new_skill";
  title: string;
  description: string;
  tech: string[];
  repo: string;
}

export default function GitHubSync() {
  const [githubUsername, setGithubUsername] = React.useState("");
  const [savedUsername, setSavedUsername] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [streamUrl, setStreamUrl] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);

  React.useEffect(() => {
    // Load saved connection
    apiClient.request("/api/github/connection", { method: "GET" })
      .then((res) => {
        if (res?.githubUsername) {
          setSavedUsername(res.githubUsername);
          setGithubUsername(res.githubUsername);
        }
      })
      .catch(() => {});

    // Load pending suggestions
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const res = await apiClient.request("/api/github/suggestions", { method: "GET" });
      setSuggestions(res.suggestions || []);
    } catch {}
  };

  const handleConnect = async () => {
    if (!githubUsername.trim()) return;
    try {
      await apiClient.request("/api/github/connect", {
        method: "POST",
        body: JSON.stringify({ githubUsername: githubUsername.trim() }),
      });
      setSavedUsername(githubUsername.trim());
      toast.success("GitHub connected!");
    } catch {
      toast.error("Failed to save GitHub username");
    }
  };

  const handleSync = async () => {
    if (!savedUsername) {
      toast.error("Connect your GitHub username first");
      return;
    }
    const resume = await getMasterResume();
    const currentSkills = resume?.skills || [];

    try {
      setPhase("syncing");
      const res = await apiClient.request("/api/github/sync", {
        method: "POST",
        body: JSON.stringify({ currentSkills }),
      });
      const id = res.job_id;
      setJobId(id);
      setStreamUrl(`${API_BASE}/api/github/stream/${id}`);
    } catch {
      setPhase("idle");
      toast.error("Failed to start GitHub sync");
    }
  };

  const handleStreamComplete = async () => {
    setPhase("done");
    if (jobId) {
      try {
        await apiClient.request(`/api/github/sync/${jobId}/complete`, { method: "POST" });
      } catch {}
    }
    await loadSuggestions();
    toast.success("Sync complete! Check suggestions below.");
  };

  const handleAccept = async (id: string) => {
    try {
      await apiClient.request(`/api/github/suggestions/${id}/accept`, { method: "POST" });
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      toast.success("Suggestion accepted — add it to your resume in the Upload tab");
    } catch {
      toast.error("Failed to accept suggestion");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await apiClient.request(`/api/github/suggestions/${id}/dismiss`, { method: "POST" });
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("Failed to dismiss");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Github className="h-6 w-6" />
          GitHub Resume Sync
        </h1>
        <p className="text-sm text-muted-foreground">
          Automatically detect new projects and skills from your GitHub repos — powered by SimhaCLI.
        </p>
      </div>

      {/* Connect GitHub */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Connect GitHub</h2>
        <div className="flex gap-2">
          <Input
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="your-github-username"
            className="flex-1"
          />
          <Button onClick={handleConnect} variant="outline" size="sm">
            Save
          </Button>
        </div>
        {savedUsername && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ Connected as <strong>{savedUsername}</strong>
          </p>
        )}
      </div>

      {/* Sync Button */}
      {savedUsername && phase === "idle" && (
        <Button onClick={handleSync} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync GitHub Repos Now
        </Button>
      )}

      {/* Stream */}
      {phase === "syncing" && jobId && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-sm font-medium">Scanning your GitHub repos…</p>
          </div>
          <SimhaCLIStream url={streamUrl} onComplete={handleStreamComplete} height={220} />
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {suggestions.length} New Suggestions
          </h2>
          {suggestions.map((s) => (
            <div
              key={s._id}
              className="rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.type === "new_project"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}
                    >
                      {s.type === "new_project" ? "Project" : "Skill"}
                    </span>
                    <h3 className="font-semibold text-sm">{s.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  {s.tech?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.tech.slice(0, 6).map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.repo && (
                    <a
                      href={`https://github.com/${savedUsername}/${s.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      github.com/{savedUsername}/{s.repo}
                    </a>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleAccept(s._id)}
                    className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors"
                    title="Accept"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDismiss(s._id)}
                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === "done" && suggestions.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No new suggestions found — your resume is already up to date with your GitHub activity.
        </div>
      )}
    </div>
  );
}
