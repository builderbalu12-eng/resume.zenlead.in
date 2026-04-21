import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Brain, Download, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, Sparkles, BookOpen, Building2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SimhaCLIStream } from "@/components/SimhaCLIStream";
import { getMasterResume } from "@/utils/storage";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

// ── Types ──────────────────────────────────────────────────

type Phase = "idle" | "generating" | "done" | "error";

interface StarStory {
  _id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  createdAt: string;
}

interface Suggestion {
  storyId: string;
  title: string;
  reason: string;
}

// ── Story Dialog (Add / Edit) ──────────────────────────────

const EMPTY_FORM = { title: "", situation: "", task: "", action: "", result: "", tags: "" };

function StoryDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial?: StarStory | null;
  onClose: () => void;
  onSaved: (story: StarStory) => void;
}) {
  const [form, setForm] = React.useState({
    title: initial?.title ?? "",
    situation: initial?.situation ?? "",
    task: initial?.task ?? "",
    action: initial?.action ?? "",
    result: initial?.result ?? "",
    tags: initial?.tags?.join(", ") ?? "",
  });
  const [saving, setSaving] = React.useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.situation.trim() || !form.task.trim() ||
        !form.action.trim() || !form.result.trim()) {
      toast.error("All 5 STAR fields are required");
      return;
    }
    setSaving(true);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        title: form.title.trim(),
        situation: form.situation.trim(),
        task: form.task.trim(),
        action: form.action.trim(),
        result: form.result.trim(),
        tags,
      };
      let story: StarStory;
      if (initial) {
        const res = await apiClient.updateStarStory(initial._id, payload);
        story = res.story;
      } else {
        const res = await apiClient.createStarStory(payload);
        story = res.story;
      }
      onSaved(story);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save story");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Story" : "Add STAR Story"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={set("title")} placeholder="e.g. Led migration to microservices" />
          </div>
          <div className="space-y-1.5">
            <Label>Situation</Label>
            <Textarea value={form.situation} onChange={set("situation")} rows={3}
              placeholder="Describe the context and background..." />
          </div>
          <div className="space-y-1.5">
            <Label>Task</Label>
            <Textarea value={form.task} onChange={set("task")} rows={3}
              placeholder="What was your specific responsibility?" />
          </div>
          <div className="space-y-1.5">
            <Label>Action</Label>
            <Textarea value={form.action} onChange={set("action")} rows={3}
              placeholder="What steps did you take?" />
          </div>
          <div className="space-y-1.5">
            <Label>Result</Label>
            <Textarea value={form.result} onChange={set("result")} rows={3}
              placeholder="What was the outcome? Include metrics if possible." />
          </div>
          <div className="space-y-1.5">
            <Label>Tags <span className="text-muted-foreground font-normal text-xs">e.g. leadership, technical, conflict</span></Label>
            <Input value={form.tags} onChange={set("tags")} placeholder="leadership, technical, conflict" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Story Card ─────────────────────────────────────────────

function StoryCard({
  story,
  onEdit,
  onDelete,
}: {
  story: StarStory;
  onEdit: (s: StarStory) => void;
  onDelete: (s: StarStory) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug">{story.title}</p>
            {!expanded && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {story.situation.slice(0, 100)}{story.situation.length > 100 ? "…" : ""}
              </p>
            )}
            {story.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {story.tags.map((tag) => (
                  <span key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-7"
              onClick={(e) => { e.stopPropagation(); onEdit(story); }}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(story); }}>
              <Trash2 className="size-3.5" />
            </Button>
            {expanded
              ? <ChevronUp className="size-4 text-muted-foreground" />
              : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded STAR fields */}
        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {(["situation", "task", "action", "result"] as const).map((field) => (
              <div key={field}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                  {field}
                </p>
                <p className="text-xs leading-relaxed">{story[field]}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Story Bank Tab ─────────────────────────────────────────

function StoryBankTab() {
  const [stories, setStories] = React.useState<StarStory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingStory, setEditingStory] = React.useState<StarStory | null>(null);
  const [deletingStory, setDeletingStory] = React.useState<StarStory | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    apiClient.getStarStories()
      .then((res) => setStories(res.stories))
      .catch(() => toast.error("Failed to load stories"))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(story: StarStory) {
    setStories((prev) => {
      const idx = prev.findIndex((s) => s._id === story._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = story;
        return next;
      }
      return [story, ...prev];
    });
    toast.success(editingStory ? "Story updated" : "Story added");
    setEditingStory(null);
  }

  async function handleDelete() {
    if (!deletingStory) return;
    setDeleting(true);
    try {
      await apiClient.deleteStarStory(deletingStory._id);
      setStories((prev) => prev.filter((s) => s._id !== deletingStory._id));
      toast.success("Story deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    } finally {
      setDeleting(false);
      setDeletingStory(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading stories…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stories.length} {stories.length === 1 ? "story" : "stories"} in your bank
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingStory(null); setDialogOpen(true); }}>
          <Plus className="size-4" />
          Add Story
        </Button>
      </div>

      {/* Empty state */}
      {stories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center space-y-3">
          <BookOpen className="size-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">Your story bank is empty</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add your first STAR story to get started.</p>
          </div>
          <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setEditingStory(null); setDialogOpen(true); }}>
            <Plus className="size-4" />
            Add Story
          </Button>
        </div>
      )}

      {/* Story list */}
      <div className="space-y-3">
        {stories.map((story) => (
          <StoryCard
            key={story._id}
            story={story}
            onEdit={(s) => { setEditingStory(s); setDialogOpen(true); }}
            onDelete={setDeletingStory}
          />
        ))}
      </div>

      {/* Add / Edit dialog */}
      {dialogOpen && (
        <StoryDialog
          initial={editingStory}
          onClose={() => { setDialogOpen(false); setEditingStory(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deletingStory && (
        <AlertDialog open onOpenChange={(open) => !open && setDeletingStory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete story?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deletingStory.title}" will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 text-white">
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// ── Suggestion Card ────────────────────────────────────────

function SuggestionCard({
  suggestion,
  stories,
}: {
  suggestion: Suggestion;
  stories: StarStory[];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const story = stories.find((s) => s._id === suggestion.storyId);

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{suggestion.title}</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline whitespace-nowrap shrink-0"
        >
          {expanded ? "Hide" : "View Full Story"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground italic leading-relaxed">{suggestion.reason}</p>

      {expanded && story && (
        <div className="mt-2 space-y-2 border-t pt-2">
          {(["situation", "task", "action", "result"] as const).map((field) => (
            <div key={field}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {field}
              </p>
              <p className="text-xs leading-relaxed mt-0.5">{story[field]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Company Intel Tab ──────────────────────────────────────

interface ResearchSection {
  name: string;
  bullets: string[];
  streaming: boolean; // true while lines for this section are still arriving
}

type IntelPhase = "idle" | "loading" | "streaming" | "done" | "error";

/**
 * Parse accumulated markdown lines into sections.
 * A `## Heading` line starts a new section.
 * A `- bullet` line appends to the current section.
 */
function parseMarkdownToSections(lines: string[]): ResearchSection[] {
  const sections: ResearchSection[] = [];
  let current: ResearchSection | null = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { name: line.slice(3).trim(), bullets: [], streaming: true };
    } else if ((line.startsWith("- ") || line.startsWith("* ")) && current) {
      current.bullets.push(line.slice(2).trim());
    }
  }
  if (current) sections.push(current);
  // Only the last section is still streaming
  sections.forEach((s, i) => { s.streaming = i === sections.length - 1; });
  return sections;
}

function CompanyIntelTab() {
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [phase, setPhase] = React.useState<IntelPhase>("idle");
  const [sections, setSections] = React.useState<ResearchSection[]>([]);
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const [creditsError, setCreditsError] = React.useState(false);
  const esRef = React.useRef<EventSource | null>(null);
  const linesRef = React.useRef<string[]>([]);

  function cleanup() {
    esRef.current?.close();
    esRef.current = null;
  }

  function reset() {
    cleanup();
    setSections([]);
    setOpenItems([]);
    linesRef.current = [];
    setCreditsError(false);
  }

  async function handleResearch() {
    if (!company.trim() || !role.trim()) {
      toast.error("Enter company name and role");
      return;
    }
    reset();
    setPhase("loading");

    let jobId: string;
    try {
      const res = await apiClient.startCompanyResearch({ company: company.trim(), role: role.trim() });
      jobId = res.job_id;
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode ?? 0;
      if (status === 402) {
        setCreditsError(true);
        setPhase("error");
      } else {
        toast.error(e.message ?? "Failed to start research");
        setPhase("error");
      }
      return;
    }

    setPhase("streaming");
    const streamUrl = `${API_BASE}/api/interview/company-research/stream/${jobId}`;
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onmessage = (e) => {
      const line: string = e.data;
      linesRef.current.push(line);
      const parsed = parseMarkdownToSections(linesRef.current);
      setSections(parsed);
      // Keep the currently-streaming section open
      if (parsed.length > 0) {
        const streamingName = parsed[parsed.length - 1].name;
        setOpenItems([streamingName]);
      }
    };

    es.addEventListener("done", () => {
      cleanup();
      // Mark all sections as done (no longer streaming)
      setSections((prev) => prev.map((s) => ({ ...s, streaming: false })));
      // Collapse all on completion
      setOpenItems([]);
      setPhase("done");
      toast.success("Research complete");
    });

    es.onerror = () => {
      cleanup();
      setPhase((prev) => (prev !== "done" ? "error" : "done"));
    };
  }

  const streamingSection = sections.find((s) => s.streaming);

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe"
              disabled={phase === "streaming" || phase === "loading"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              disabled={phase === "streaming" || phase === "loading"}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleResearch}
            disabled={phase === "streaming" || phase === "loading" || !company.trim() || !role.trim()}
            className="gap-2"
          >
            {(phase === "loading" || phase === "streaming") ? (
              <><Loader2 className="size-4 animate-spin" />
                {phase === "loading" ? "Starting…" : `Researching ${company}…`}</>
            ) : (
              <><Building2 className="size-4" />Research Company</>
            )}
          </Button>
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
            2 credits
          </span>
        </div>

        {/* Insufficient credits error */}
        {creditsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <p className="text-destructive font-medium">Not enough credits.</p>
            <a href="/pricing" className="text-xs text-primary underline underline-offset-2 mt-0.5 block">
              Top up to use Company Intel →
            </a>
          </div>
        )}
      </div>

      {/* Streaming / done output */}
      {sections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
            {company} · {role}
          </p>

          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="space-y-1.5"
          >
            {sections.map((section) => (
              <AccordionItem
                key={section.name}
                value={section.name}
                className="rounded-lg border bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    {section.name}
                    {section.streaming && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                        <Loader2 className="size-2.5 animate-spin" />
                        loading…
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {section.bullets.length > 0 ? (
                    <ul className="space-y-1.5">
                      {section.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Generating…</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {phase === "done" && (
            <p className="text-[11px] text-muted-foreground/60 text-right pt-1">
              2 credits used
            </p>
          )}
        </div>
      )}

      {phase === "done" && sections.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { reset(); setPhase("idle"); }}
        >
          ← Research another company
        </Button>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

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

  // Story suggest state
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = React.useState(false);
  const [bankStories, setBankStories] = React.useState<StarStory[]>([]);
  const [bankLoaded, setBankLoaded] = React.useState(false);

  React.useEffect(() => {
    apiClient.request("/api/applications", { method: "GET" })
      .then((res) => setRecentApps((res.applications || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  // Pre-load bank stories so SuggestionCards can expand full content
  React.useEffect(() => {
    if (bankLoaded) return;
    apiClient.getStarStories()
      .then((res) => { setBankStories(res.stories); setBankLoaded(true); })
      .catch(() => {});
  }, [bankLoaded]);

  const handleStart = async () => {
    if (!company.trim() || !jobTitle.trim()) {
      toast.error("Enter company name and job title");
      return;
    }
    const resume = await getMasterResume();
    try {
      setPhase("generating");
      setSuggestions([]);
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
    if (jobId) {
      try {
        const res = await apiClient.request(`/api/interview/result/${jobId}`, { method: "GET" });
        if (res?.content) { setMarkdownContent(res.content); return; }
      } catch {}
    }
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

  const handleFindStories = async () => {
    if (!bankLoaded) return;
    if (bankStories.length === 0) {
      toast.error("Add stories to your bank first");
      return;
    }
    setSuggestLoading(true);
    try {
      const res = await apiClient.suggestStarStories({
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobDescription: markdownContent.slice(0, 2000),
      });
      if (res.message) {
        toast.error(res.message);
        return;
      }
      setSuggestions(res.suggestions);
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode ?? 0;
      if (status === 402) {
        toast.error("Not enough credits");
      } else {
        toast.error(e.message ?? "Failed to fetch suggestions");
      }
    } finally {
      setSuggestLoading(false);
    }
  };

  const pickApplication = (app: any) => {
    setCompany(app.company || "");
    setJobTitle(app.jobTitle || "");
    setShowApps(false);
  };

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

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Interview Prep
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate personalised Q&amp;A and manage your behavioural story bank.
        </p>
      </div>

      <Tabs defaultValue="prep">
        <TabsList>
          <TabsTrigger value="prep" className="gap-2">
            <Brain className="size-4" />
            Prep
          </TabsTrigger>
          <TabsTrigger value="stories" className="gap-2">
            <BookOpen className="size-4" />
            Story Bank
          </TabsTrigger>
          <TabsTrigger value="intel" className="gap-2">
            <Building2 className="size-4" />
            Company Intel
          </TabsTrigger>
        </TabsList>

        {/* ── Interview Prep tab ── */}
        <TabsContent value="prep" className="mt-4 space-y-4">

          {phase === "idle" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Title</label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" />
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
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    Print / PDF
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-1 print:shadow-none">
                {renderMarkdown(markdownContent)}
              </div>

              {/* Find Matching Stories */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Match stories from your bank</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      AI picks your 3 most relevant STAR stories for this role.{" "}
                      <span className="text-muted-foreground/70">1 credit</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={handleFindStories}
                    disabled={suggestLoading}
                  >
                    {suggestLoading
                      ? <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />Finding…</span>
                      : <><Sparkles className="size-3.5" />Find Matching Stories</>
                    }
                  </Button>
                </div>

                {suggestLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Finding your best stories for this role…
                  </p>
                )}

                {suggestions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Suggested Stories from Your Bank
                    </p>
                    {suggestions.map((s) => (
                      <SuggestionCard key={s.storyId} suggestion={s} stories={bankStories} />
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPhase("idle"); setMarkdownContent(""); setJobId(null); setSuggestions([]); }}
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
        </TabsContent>

        {/* ── Story Bank tab ── */}
        <TabsContent value="stories" className="mt-4">
          <StoryBankTab />
        </TabsContent>

        {/* ── Company Intel tab ── */}
        <TabsContent value="intel" className="mt-4">
          <CompanyIntelTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
