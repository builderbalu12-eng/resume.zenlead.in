import { useEffect, useState } from "react";
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
} from "lucide-react";

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
  evaluated: "bg-slate-100 text-slate-700 border-slate-200",
  applied: "bg-blue-100 text-blue-700 border-blue-200",
  responded: "bg-cyan-100 text-cyan-700 border-cyan-200",
  contacted: "bg-violet-100 text-violet-700 border-violet-200",
  interview: "bg-amber-100 text-amber-700 border-amber-200",
  offer: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  discarded: "bg-gray-100 text-gray-500 border-gray-200",
};

// Column background colors for Kanban
const STAGE_COLUMN_BG: Record<PipelineStage, string> = {
  evaluated: "bg-slate-50 border-slate-200",
  applied:   "bg-blue-50 border-blue-200",
  responded: "bg-cyan-50 border-cyan-200",
  contacted: "bg-violet-50 border-violet-200",
  interview: "bg-yellow-50 border-yellow-200",
  offer:     "bg-green-50 border-green-200",
  rejected:  "bg-red-50 border-red-200",
  discarded: "bg-gray-50 border-gray-200",
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

function EditDialog({
  app,
  onClose,
  onSaved,
}: {
  app: TrackerApplication;
  onClose: () => void;
  onSaved: (updated: Partial<TrackerApplication>) => void;
}) {
  const [stage, setStage] = useState<PipelineStage>(app.pipelineStage ?? "evaluated");
  const [notes, setNotes] = useState(app.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(app.followUpDate ?? "");
  const [saving, setSaving] = useState(false);

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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {app.jobTitle} — {app.company}
          </DialogTitle>
        </DialogHeader>

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
}: {
  apps: TrackerApplication[];
  onEdit: (app: TrackerApplication) => void;
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
            <TableHead>Applied Date</TableHead>
            <TableHead>Follow-up Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
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
                <StageBadge stage={(app.pipelineStage as PipelineStage) ?? "evaluated"} />
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onEdit(app)}
                >
                  <Edit2 className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Insights placeholder ───────────────────────────────────

function InsightsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <BarChart2 className="mb-3 size-10 opacity-30" />
      <p className="text-sm font-medium">Insights coming soon</p>
      <p className="text-xs mt-1">Track 10+ applications to unlock pattern analytics.</p>
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
  onDragStart,
}: {
  app: TrackerApplication;
  onEdit: (app: TrackerApplication) => void;
  onDragStart: (e: React.DragEvent, appId: string) => void;
}) {
  const isOverdue =
    app.followUpDate && new Date(app.followUpDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app._id)}
      className="rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
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

      {/* ATS badge + follow-up */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {app.matchPercentage > 0 ? (
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold font-mono border ${
              app.matchPercentage >= 75
                ? "bg-green-50 text-green-700 border-green-200"
                : app.matchPercentage >= 50
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {app.matchPercentage}%
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">No score</span>
        )}

        {app.followUpDate && (
          <span
            className={`flex items-center gap-0.5 text-[11px] ${
              isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
            }`}
          >
            <Calendar className="size-3" />
            {format(new Date(app.followUpDate), "dd MMM")}
            {isOverdue && <span className="ml-0.5">·overdue</span>}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanBoard({
  apps,
  onEdit,
  onStageChange,
}: {
  apps: TrackerApplication[];
  onEdit: (app: TrackerApplication) => void;
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

  useEffect(() => {
    fetchApplications()
      .then(setApps)
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(id: string, updates: Partial<TrackerApplication>) {
    setApps((prev) =>
      prev.map((a) => (a._id === id ? { ...a, ...updates } : a))
    );
  }

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
            <TableTab apps={apps} onEdit={setEditingApp} />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsPlaceholder />
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
    </div>
  );
}
