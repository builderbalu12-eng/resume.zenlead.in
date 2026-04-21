import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  KanbanSquare,
  List,
  BarChart2,
  Edit2,
  Loader2,
  Calendar,
  ExternalLink,
  Mail,
  Copy,
  Sparkles,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FollowupSheet, type UrgencyLevel } from "@/components/tracker/FollowupSheet";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/services/api";

// ── Types ──────────────────────────────────────────────────

export type PipelineStage =
  | "evaluated"
  | "applied"
  | "responded"
  | "contacted"
  | "interview"
  | "offer"
  | "rejected"
  | "discarded";

export interface TrackerApplication {
  _id: string;
  jobTitle: string;
  company: string;
  location: string;
  jobUrl: string;
  matchPercentage: number;
  status: string;
  pipelineStage: PipelineStage;
  notes: string;
  followUpDate?: string;
  evaluationGrade: string;
  evaluationScore?: number;
  compensationNotes: string;
  createdAt: string;
  userId: string;
}

// ── Helpers ────────────────────────────────────────────────

const STAGE_LABELS: Record<PipelineStage, string> = {
  evaluated: "Evaluated",
  applied: "Applied",
  responded: "Responded",
  contacted: "Contacted",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  discarded: "Discarded",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  evaluated: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  applied:   "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  responded: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  contacted: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  interview: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  offer:     "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  rejected:  "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  discarded: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

// Column background colors for Kanban
const STAGE_COLUMN_BG: Record<PipelineStage, string> = {
  evaluated: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700",
  applied:   "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  responded: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800",
  contacted: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
  interview: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  offer:     "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  rejected:  "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  discarded: "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700",
};

function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

// ── Grade helpers ──────────────────────────────────────────

function gradeColor(grade: string): string {
  const g = (grade ?? "").charAt(0).toUpperCase();
  if (g === "A") return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
  if (g === "B") return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (g === "C") return "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  if (g === "D") return "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  if (g === "F") return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
  return "";
}

function GradeTag({ grade }: { grade?: string }) {
  if (!grade) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums min-w-[2rem] ${gradeColor(grade)}`}
    >
      {grade}
    </span>
  );
}

// ── Urgency helpers ────────────────────────────────────────

const FOLLOWUP_STAGES: PipelineStage[] = ["applied", "responded", "contacted"];

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function computeUrgency(days: number): UrgencyLevel {
  if (days > 14) return "URGENT";
  if (days > 7) return "OVERDUE";
  if (days > 3) return "WAITING";
  return "NOT_YET";
}

const URGENCY_BADGE: Record<UrgencyLevel, string> = {
  URGENT:  "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
  OVERDUE: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
  WAITING: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
  NOT_YET: "",
};

const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  URGENT:  "Urgent",
  OVERDUE: "Overdue",
  WAITING: "Waiting",
  NOT_YET: "",
};

function UrgencyBadge({ app }: { app: TrackerApplication }) {
  if (!FOLLOWUP_STAGES.includes(app.pipelineStage)) return null;
  const days = getDaysSince(app.createdAt);
  const urgency = computeUrgency(days);
  if (urgency === "NOT_YET") return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${URGENCY_BADGE[urgency]}`}>
      {URGENCY_LABEL[urgency]}
    </span>
  );
}

// ── API helpers ────────────────────────────────────────────

async function fetchApplications(): Promise<TrackerApplication[]> {
  const res = await apiClient.getApplicationHistory();
  return res as TrackerApplication[];
}

async function patchApplication(
  id: string,
  data: {
    pipelineStage?: string;
    notes?: string;
    followUpDate?: string | null;
    evaluationGrade?: string;
    compensationNotes?: string;
  }
): Promise<void> {
  await apiClient.patchApplication(id, data);
}

// ── Edit Dialog ────────────────────────────────────────────

type ContactType = "hiring_manager" | "recruiter" | "peer" | "interviewer";

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  hiring_manager: "Hiring Manager",
  recruiter: "Recruiter",
  peer: "Peer / Employee",
  interviewer: "Interviewer",
};

function EditDialog({
  app,
  onClose,
  onSaved,
}: {
  app: TrackerApplication;
  onClose: () => void;
  onSaved: (updated: Partial<TrackerApplication>) => void;
}) {
  // ── Application fields ────────────────────────────────
  const [stage, setStage] = useState<PipelineStage>(app.pipelineStage ?? "evaluated");
  const [notes, setNotes] = useState(app.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(app.followUpDate ?? "");
  const [saving, setSaving] = useState(false);

  // ── Outreach fields ───────────────────────────────────
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactType, setContactType] = useState<ContactType>("hiring_manager");
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState("");
  const [outreachError, setOutreachError] = useState<{ text: string; isCredits: boolean } | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      await patchApplication(app._id, {
        pipelineStage: stage,
        notes,
        followUpDate: followUpDate || null,
      });
      onSaved({ pipelineStage: stage, notes, followUpDate: followUpDate || undefined });
      toast.success("Application updated");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateOutreach() {
    if (!contactName.trim() || !contactTitle.trim()) {
      toast.error("Enter contact name and title");
      return;
    }
    setGeneratingOutreach(true);
    setOutreachMessage("");
    setOutreachError(null);
    try {
      const res = await apiClient.generateOutreach({
        contactName: contactName.trim(),
        contactTitle: contactTitle.trim(),
        contactType,
        company: app.company,
        yourRole: app.jobTitle,
        applicationId: app._id,
      });
      setOutreachMessage(res.message);
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode ?? 0;
      if (status === 402) {
        setOutreachError({ text: "Not enough credits to generate a message.", isCredits: true });
      } else {
        setOutreachError({ text: e.message ?? "Failed to generate", isCredits: false });
      }
    } finally {
      setGeneratingOutreach(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(outreachMessage);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  }

  const charCount = outreachMessage.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {app.jobTitle} — {app.company}
          </DialogTitle>
        </DialogHeader>

        {/* ── Application fields ── */}
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Pipeline Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as PipelineStage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this application..."
            />
          </div>
        </div>

        {/* ── Outreach section ── */}
        <Separator />

        <div className="space-y-3 pb-2">
          <p className="text-sm font-semibold">Generate LinkedIn Message</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Name</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Title</Label>
              <Input
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                placeholder="e.g. Engineering Manager"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Contact Type</Label>
            <Select value={contactType} onValueChange={(v) => setContactType(v as ContactType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {CONTACT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateOutreach}
              disabled={generatingOutreach}
              className="gap-1.5"
            >
              {generatingOutreach && <Loader2 className="size-3.5 animate-spin" />}
              Generate
            </Button>
            <span className="text-xs text-muted-foreground">(1 credit)</span>
          </div>

          {/* Credit / generic error */}
          {outreachError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
              <p className="text-destructive">{outreachError.text}</p>
              {outreachError.isCredits && (
                <a href="/pricing" className="text-primary underline underline-offset-2 mt-0.5 block">
                  Top up credits →
                </a>
              )}
            </div>
          )}

          {/* Generated message */}
          {outreachMessage && (
            <div className="space-y-2">
              <Textarea
                value={outreachMessage}
                onChange={(e) => setOutreachMessage(e.target.value.slice(0, 300))}
                rows={4}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono tabular-nums ${
                    charCount > 300 ? "text-red-600 font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {charCount} / 300
                </span>
                <Button size="sm" variant="outline" className="gap-1.5 h-7" onClick={handleCopy}>
                  <Copy className="size-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Table Tab ──────────────────────────────────────────────

function TableTab({
  apps,
  onEdit,
  onFollowup,
}: {
  apps: TrackerApplication[];
  onEdit: (app: TrackerApplication) => void;
  onFollowup: (app: TrackerApplication) => void;
}) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <KanbanSquare className="mb-3 size-10 opacity-30" />
        <p className="text-sm">No applications tracked yet.</p>
        <p className="text-xs mt-1">Use the "Track" button on any job card in Find Jobs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-right">ATS Score</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Follow-up Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const isFollowupEligible = FOLLOWUP_STAGES.includes(app.pipelineStage);
            return (
              <TableRow key={app._id}>
                <TableCell className="font-medium">
                  {app.jobUrl ? (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {app.company}
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ) : (
                    app.company
                  )}
                </TableCell>
                <TableCell>{app.jobTitle}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StageBadge stage={(app.pipelineStage as PipelineStage) ?? "evaluated"} />
                    <UrgencyBadge app={app} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {app.matchPercentage > 0 ? (
                    <span
                      className={`font-mono text-xs font-semibold ${
                        app.matchPercentage >= 75
                          ? "text-green-600"
                          : app.matchPercentage >= 50
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {app.matchPercentage}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <GradeTag grade={app.evaluationGrade} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {app.createdAt
                    ? format(new Date(app.createdAt), "dd MMM yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {app.followUpDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {format(new Date(app.followUpDate), "dd MMM yyyy")}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                  {app.notes || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isFollowupEligible && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="Generate follow-up"
                        onClick={() => onFollowup(app)}
                      >
                        <Mail className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onEdit(app)}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Insights Tab ──────────────────────────────────────────

const PIPELINE_STAGES_ORDER: PipelineStage[] = [
  "evaluated", "applied", "responded", "contacted",
  "interview", "offer", "rejected", "discarded",
];

const FUNNEL_BAR_COLORS: Partial<Record<PipelineStage, string>> = {
  applied:   "bg-blue-500",
  responded: "bg-cyan-500",
  contacted: "bg-violet-500",
  interview: "bg-yellow-500",
  offer:     "bg-green-500",
  rejected:  "bg-red-500",
};

interface InsightsData {
  totalApplications: number;
  stageBreakdown: Record<string, number>;
  avgAtsScoreByStage: Record<string, number | null>;
}

interface ObservationsData {
  observations: string[];
  generatedAt: string;
  cached: boolean;
}

function InsightsTab({ totalApps }: { totalApps: number }) {
  const THRESHOLD = 10;

  const [stats, setStats] = useState<InsightsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [observations, setObservations] = useState<ObservationsData | null>(null);
  const [obsLoading, setObsLoading] = useState(false);
  const [obsError, setObsError] = useState<string | null>(null);

  useEffect(() => {
    if (totalApps < THRESHOLD) return;
    apiClient.getApplicationStats()
      .then(setStats)
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setStatsLoading(false));
  }, [totalApps]);

  async function handleGenerateInsights() {
    setObsLoading(true);
    setObsError(null);
    try {
      const res = await apiClient.getApplicationInsights();
      setObservations(res);
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode ?? 0;
      if (status === 402) {
        setObsError("Not enough credits.");
      } else {
        setObsError(e.message ?? "Failed to generate insights");
      }
    } finally {
      setObsLoading(false);
    }
  }

  // ── Empty state ────────────────────────────────────────
  if (totalApps < THRESHOLD) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
        <BarChart2 className="size-10 opacity-30" />
        <p className="text-sm font-medium">Track 10+ applications to unlock AI insights</p>
        <p className="text-xs">
          You have{" "}
          <span className="font-semibold text-foreground">{totalApps}</span>{" "}
          tracked {totalApps === 1 ? "application" : "applications"}
        </p>
      </div>
    );
  }

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stages = Object.keys(stats.stageBreakdown) as PipelineStage[];
  const maxCount = Math.max(...Object.values(stats.stageBreakdown), 1);

  // Find stage with highest avg ATS
  let bestAtsStage: string | null = null;
  let bestAtsScore = -1;
  for (const [stage, score] of Object.entries(stats.avgAtsScoreByStage)) {
    if (score !== null && score > bestAtsScore) {
      bestAtsScore = score;
      bestAtsStage = stage;
    }
  }

  return (
    <div className="space-y-8">

      {/* ── Section A: Conversion Funnel ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Conversion Funnel</h3>
        <div className="space-y-2">
          {PIPELINE_STAGES_ORDER.map((stage) => {
            const count = stats.stageBreakdown[stage] ?? 0;
            const pct = stats.totalApplications > 0
              ? Math.round((count / stats.totalApplications) * 100)
              : 0;
            const barColor = FUNNEL_BAR_COLORS[stage] ?? "bg-slate-400";
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-right text-muted-foreground capitalize">
                  {STAGE_LABELS[stage]}
                </span>
                <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded ${barColor} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-xs text-muted-foreground">
                  {count > 0 ? `${count} app${count !== 1 ? "s" : ""} · ${pct}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section B: ATS Score by Stage ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">ATS Score by Stage</h3>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Avg ATS Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PIPELINE_STAGES_ORDER.map((stage) => {
                const count = stats.stageBreakdown[stage] ?? 0;
                const avg = stats.avgAtsScoreByStage[stage];
                const isBest = stage === bestAtsStage && avg !== null;
                return (
                  <TableRow
                    key={stage}
                    className={isBest ? "bg-green-50 dark:bg-green-950/20" : ""}
                  >
                    <TableCell className="capitalize text-sm">
                      <span className="flex items-center gap-2">
                        {STAGE_LABELS[stage]}
                        {isBest && (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            best
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{count || "—"}</TableCell>
                    <TableCell className="text-right text-sm">
                      {avg !== null && avg !== undefined
                        ? <span className={isBest ? "font-semibold text-green-700" : ""}>{avg}%</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Section C: AI Observations ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">AI Observations</h3>
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {!observations && !obsLoading && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Get AI-powered observations from your application patterns.
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleGenerateInsights} className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  Generate Insights
                </Button>
                <span className="text-xs text-muted-foreground">(1 credit)</span>
              </div>
              {obsError && (
                <p className="text-xs text-destructive">{obsError}</p>
              )}
            </div>
          )}

          {obsLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              Analyzing your application patterns…
            </div>
          )}

          {observations && !obsLoading && (
            <div className="space-y-3">
              <ul className="space-y-2">
                {observations.observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 mt-0.5 text-primary">→</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-[11px] text-muted-foreground">
                  {observations.cached ? "Cached · " : ""}
                  Last generated: {format(new Date(observations.generatedAt), "dd MMM yyyy, HH:mm")}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateInsights}
                    disabled={obsLoading}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Sparkles className="size-3" />
                    Refresh
                  </Button>
                  <span className="text-[11px] text-muted-foreground">(1 credit)</span>
                </div>
              </div>

              {obsError && (
                <p className="text-xs text-destructive">{obsError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Kanban Board ───────────────────────────────────────────

const STAGES_ORDER: PipelineStage[] = [
  "evaluated",
  "applied",
  "responded",
  "contacted",
  "interview",
  "offer",
  "rejected",
  "discarded",
];

function KanbanCard({
  app,
  onEdit,
  onFollowup,
  onDragStart,
}: {
  app: TrackerApplication;
  onEdit: (app: TrackerApplication) => void;
  onFollowup: (app: TrackerApplication) => void;
  onDragStart: (e: React.DragEvent, appId: string) => void;
}) {
  const isOverdue =
    app.followUpDate && new Date(app.followUpDate) < new Date();
  const isFollowupEligible = FOLLOWUP_STAGES.includes(app.pipelineStage);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app._id)}
      className="rounded-lg border bg-white dark:bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
    >
      {/* Company + edit */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">{app.company}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{app.jobTitle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 -mr-1 -mt-0.5"
          onClick={(e) => { e.stopPropagation(); onEdit(app); }}
        >
          <Edit2 className="size-3" />
        </Button>
      </div>

      {/* ATS badge + urgency + follow-up date */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {app.matchPercentage > 0 ? (
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold font-mono border ${
              app.matchPercentage >= 75
                ? "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                : app.matchPercentage >= 50
                ? "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800"
            }`}
          >
            {app.matchPercentage}%
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">No score</span>
        )}

        {app.evaluationGrade && (
          <span
            className={`inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${gradeColor(app.evaluationGrade)}`}
          >
            {app.evaluationGrade}
          </span>
        )}

        <UrgencyBadge app={app} />

        {app.followUpDate && (
          <span
            className={`flex items-center gap-0.5 text-[11px] ${
              isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
            }`}
          >
            <Calendar className="size-3" />
            {format(new Date(app.followUpDate), "dd MMM")}
            {isOverdue && <span className="ml-0.5">· overdue</span>}
          </span>
        )}
      </div>

      {/* Follow-up button */}
      {isFollowupEligible && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onFollowup(app); }}
          >
            <Mail className="size-3" />
            Follow-up
          </Button>
        </div>
      )}
    </div>
  );
}

function KanbanBoard({
  apps,
  onEdit,
  onFollowup,
  onStageChange,
}: {
  apps: TrackerApplication[];
  onEdit: (app: TrackerApplication) => void;
  onFollowup: (app: TrackerApplication) => void;
  onStageChange: (appId: string, stage: PipelineStage) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const byStage = STAGES_ORDER.reduce<Record<PipelineStage, TrackerApplication[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<PipelineStage, TrackerApplication[]>
  );
  for (const app of apps) {
    const stage = (app.pipelineStage as PipelineStage) ?? "evaluated";
    byStage[stage].push(app);
  }

  function handleDragStart(e: React.DragEvent, appId: string) {
    setDraggingId(appId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }

  function handleDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    if (draggingId) {
      const app = apps.find((a) => a._id === draggingId);
      if (app && app.pipelineStage !== stage) {
        onStageChange(draggingId, stage);
      }
    }
    setDraggingId(null);
    setDragOverStage(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 items-start">
      {STAGES_ORDER.map((stage) => {
        const cards = byStage[stage];
        const isOver = dragOverStage === stage;
        const colBg = STAGE_COLUMN_BG[stage];
        return (
          <div
            key={stage}
            className={`flex w-56 shrink-0 flex-col rounded-xl border p-2 transition-colors ${colBg} ${
              isOver ? "ring-2 ring-primary/40 brightness-95" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column header */}
            <div className="mb-2 flex items-center justify-between px-1 py-0.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                {STAGE_LABELS[stage]}
              </span>
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold min-w-[1.25rem] ${STAGE_COLORS[stage]}`}
              >
                {cards.length}
              </span>
            </div>

            {/* Card list — scrollable */}
            <div className="flex flex-col gap-2 min-h-[80px] max-h-[calc(100vh-260px)] overflow-y-auto">
              {cards.map((app) => (
                <KanbanCard
                  key={app._id}
                  app={app}
                  onEdit={onEdit}
                  onFollowup={onFollowup}
                  onDragStart={handleDragStart}
                />
              ))}
              {cards.length === 0 && (
                <div className="flex items-center justify-center py-6 text-[11px] text-muted-foreground/50 select-none">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function TrackerPage() {
  const [apps, setApps] = useState<TrackerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<TrackerApplication | null>(null);
  const [followupApp, setFollowupApp] = useState<TrackerApplication | null>(null);
  const [searchParams] = useSearchParams();
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">(
    () => (searchParams.get("stage") as PipelineStage | null) ?? "all"
  );

  useEffect(() => {
    fetchApplications()
      .then(setApps)
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  // Sync stage filter if URL param changes
  useEffect(() => {
    const s = searchParams.get("stage") as PipelineStage | null;
    if (s) setStageFilter(s);
  }, [searchParams]);

  function handleSaved(id: string, updates: Partial<TrackerApplication>) {
    setApps((prev) =>
      prev.map((a) => (a._id === id ? { ...a, ...updates } : a))
    );
  }

  const filteredApps = useMemo(
    () => stageFilter === "all" ? apps : apps.filter((a) => a.pipelineStage === stageFilter),
    [apps, stageFilter]
  );

  const followupUrgency: UrgencyLevel = followupApp
    ? computeUrgency(getDaysSince(followupApp.createdAt))
    : "NOT_YET";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Application Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track every application through your job search pipeline.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="table">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban" className="gap-2">
              <KanbanSquare className="size-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="size-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart2 className="size-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <KanbanBoard
              apps={apps}
              onEdit={setEditingApp}
              onFollowup={setFollowupApp}
              onStageChange={async (appId, stage) => {
                setApps((prev) =>
                  prev.map((a) => (a._id === appId ? { ...a, pipelineStage: stage } : a))
                );
                try {
                  await patchApplication(appId, { pipelineStage: stage });
                } catch {
                  toast.error("Failed to update stage");
                  setApps((prev) =>
                    prev.map((a) =>
                      a._id === appId
                        ? { ...a, pipelineStage: apps.find((x) => x._id === appId)?.pipelineStage ?? "evaluated" }
                        : a
                    )
                  );
                }
              }}
            />
          </TabsContent>

          <TabsContent value="table">
            {/* Stage filter bar */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Filter:</span>
              <button
                onClick={() => setStageFilter("all")}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  stageFilter === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                All ({apps.length})
              </button>
              {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((s) => {
                const count = apps.filter((a) => a.pipelineStage === s).length;
                if (count === 0) return null;
                return (
                  <button
                    key={s}
                    onClick={() => setStageFilter(stageFilter === s ? "all" : s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      stageFilter === s
                        ? STAGE_COLORS[s]
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {STAGE_LABELS[s]} ({count})
                  </button>
                );
              })}
            </div>
            <TableTab apps={filteredApps} onEdit={setEditingApp} onFollowup={setFollowupApp} />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsTab totalApps={apps.length} />
          </TabsContent>
        </Tabs>
      )}

      {editingApp && (
        <EditDialog
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSaved={(updates) => handleSaved(editingApp._id, updates)}
        />
      )}

      {followupApp && (
        <FollowupSheet
          appId={followupApp._id}
          jobTitle={followupApp.jobTitle}
          company={followupApp.company}
          urgency={followupUrgency}
          open={!!followupApp}
          onClose={() => setFollowupApp(null)}
        />
      )}
    </div>
  );
}
