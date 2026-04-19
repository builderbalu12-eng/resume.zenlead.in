import { useState, useMemo } from "react";
import {
  LayoutGrid, TableIcon, Mail, Trash2, ChevronRight,
  Star, Globe, MapPin, Tag, MoveRight, Sparkles, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Client, ClientStatus } from "@/services/businessService";
import { businessService } from "@/services/businessService";
import { EmailComposerDialog } from "./EmailComposerDialog";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { toast } from "sonner";

interface LeadsCRMBoardProps {
  leads: Client[];
  isLoading?: boolean;
  onChangeStatus: (id: string, status: ClientStatus) => void;
  onDelete: (id: string) => void;
  onBulkChangeStatus: (ids: string[], status: ClientStatus) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onUpdateLead: (id: string, changes: Partial<Client>) => void;
}

const COLUMNS: {
  status: ClientStatus;
  label: string;
  description: string;
  border: string;
  accent: string;
  dot: string;
}[] = [
  {
    status: "lead",
    label: "Lead",
    description: "Not contacted yet",
    border: "border-l-amber-400",
    accent: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-400",
  },
  {
    status: "active",
    label: "Active",
    description: "In conversation",
    border: "border-l-green-400",
    accent: "text-green-600 dark:text-green-400",
    dot: "bg-green-400",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Converted to client",
    border: "border-l-blue-400",
    accent: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-400",
  },
  {
    status: "lost",
    label: "Lost",
    description: "Declined / no interest",
    border: "border-l-red-400",
    accent: "text-red-600 dark:text-red-400",
    dot: "bg-red-400",
  },
];

type ViewMode = "kanban" | "table";

function MoveToMenu({
  currentStatus,
  onMove,
}: {
  currentStatus: string;
  onMove: (s: ClientStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const others = COLUMNS.filter((c) => c.status !== currentStatus);
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoveRight className="h-3 w-3" /> Move
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-1 w-36 rounded-xl border bg-popover shadow-lg py-1">
            {others.map((col) => (
              <button
                key={col.status}
                onClick={(e) => { e.stopPropagation(); onMove(col.status); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                {col.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KanbanCard({
  lead,
  col,
  onMove,
  onDelete,
  onSelect,
  isSelected,
  onToggleSelect,
  onInsightUpdate,
}: {
  lead: Client;
  col: typeof COLUMNS[0];
  onMove: (s: ClientStatus) => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  onInsightUpdate: (insight: string) => void;
}) {
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insight, setInsight] = useState<string | null>(lead.ai_insight ?? null);
  const [showInsight, setShowInsight] = useState(false);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.id) return;
    if (insight) { setShowInsight((v) => !v); return; }
    setLoadingInsight(true);
    setShowInsight(true);
    try {
      const res = await businessService.analyzeLead(lead.id);
      setInsight(res.insight);
      onInsightUpdate(res.insight);
      if (!res.cached) toast.success("AI insight generated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate insight");
      setShowInsight(false);
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div
      className={`group rounded-xl border-l-4 ${col.border} border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer`}
      onClick={onSelect}
    >
      <div className="p-3">
        {/* Top: checkbox + name + delete */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-primary"
          />
          <p className="flex-1 text-sm font-semibold leading-snug">{lead.name}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Meta */}
        <div className="mt-2 space-y-1">
          {lead.category && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Tag className="h-2.5 w-2.5 shrink-0" />
              <span className="capitalize">{lead.category}</span>
            </div>
          )}
          {lead.address && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{lead.address}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {lead.rating != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Star className="h-2.5 w-2.5 text-amber-400" />
                {lead.rating.toFixed(1)}
              </span>
            )}
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${lead.has_website ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
              <Globe className="h-2.5 w-2.5" />
              {lead.has_website ? "Has website" : "No website"}
            </span>
          </div>
        </div>

        {/* AI insight panel */}
        {showInsight && (
          <div
            className="mt-2 rounded-lg border border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/20 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingInsight ? (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
              </div>
            ) : (
              <p className="text-[10px] leading-relaxed text-muted-foreground">{insight}</p>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div
          className="mt-2 flex items-center justify-between border-t border-border/50 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <MoveToMenu currentStatus={lead.status ?? "lead"} onMove={onMove} />
          <div className="flex items-center gap-1">
            {lead.id && (
              <button
                onClick={handleAnalyze}
                disabled={loadingInsight}
                className={`rounded p-1 transition-colors ${insight ? "text-purple-500" : "text-muted-foreground hover:text-purple-500"}`}
                title="AI Analyze"
              >
                <Sparkles className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={onSelect}
              className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="View details"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadsCRMBoard({
  leads,
  isLoading,
  onChangeStatus,
  onDelete,
  onBulkChangeStatus,
  onBulkDelete,
  onUpdateLead,
}: LeadsCRMBoardProps) {
  const [view, setView] = useState<ViewMode>("kanban");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeLead, setActiveLead] = useState<Client | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, Client[]> = { lead: [], active: [], completed: [], lost: [] };
    for (const lead of leads) {
      const s = lead.status ?? "lead";
      if (map[s]) map[s].push(lead);
      else map["lead"].push(lead);
    }
    return map;
  }, [leads]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} leads?`)) return;
    setBulkLoading(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedLeads = leads.filter((l) => l.id && selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading leads…
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="mt-10 rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
        <p className="font-medium">No leads yet</p>
        <p className="mt-1 text-sm">Use the Discover tab to find leads, then manage them here.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-xs text-muted-foreground">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} across {COLUMNS.filter(c => grouped[c.status]?.length > 0).length} stages
        </p>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 min-h-0 flex gap-3 overflow-hidden`}>
        {/* Kanban / Table */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {view === "kanban" ? (
            /* Horizontal scroll with fixed-width columns */
            <div className="h-full overflow-x-auto overflow-y-hidden">
              <div className="flex h-full gap-3 pb-2" style={{ minWidth: `${COLUMNS.length * 280}px` }}>
                {COLUMNS.map((col) => {
                  const colLeads = grouped[col.status] ?? [];
                  return (
                    <div key={col.status} className="flex w-[268px] shrink-0 flex-col rounded-xl border bg-muted/20">
                      {/* Column header */}
                      <div className={`flex items-center justify-between rounded-t-xl border-b px-4 py-3`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                          <div>
                            <p className={`text-sm font-bold ${col.accent}`}>{col.label}</p>
                            <p className="text-[10px] text-muted-foreground">{col.description}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                          {colLeads.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <ScrollArea className="flex-1 px-3 py-3">
                        <div className="flex flex-col gap-2 pb-2">
                          {colLeads.map((lead) => (
                            <KanbanCard
                              key={lead.id}
                              lead={lead}
                              col={col}
                              onMove={(s) => lead.id && onChangeStatus(lead.id, s)}
                              onDelete={() => lead.id && onDelete(lead.id)}
                              onSelect={() => setActiveLead(lead)}
                              isSelected={!!(lead.id && selectedIds.has(lead.id))}
                              onToggleSelect={() => lead.id && toggleSelect(lead.id)}
                              onInsightUpdate={(insight) => lead.id && onUpdateLead(lead.id, { ai_insight: insight })}
                            />
                          ))}
                          {colLeads.length === 0 && (
                            <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-5 text-center">
                              <p className="text-[10px] text-muted-foreground">No {col.label.toLowerCase()} leads</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Table view */
            <div className="h-full overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <tr className="border-b">
                    <th className="py-2.5 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={leads.length > 0 && selectedIds.size === leads.length}
                        onChange={() => {
                          if (selectedIds.size === leads.length) clearSelection();
                          else setSelectedIds(new Set(leads.map((l) => l.id!).filter(Boolean)));
                        }}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                    </th>
                    {["Name", "Category", "Rating", "Status", "Website", ""].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const col = COLUMNS.find(c => c.status === (lead.status ?? "lead")) ?? COLUMNS[0];
                    return (
                      <tr
                        key={lead.id}
                        className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                        onClick={() => setActiveLead(lead)}
                      >
                        <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={!!(lead.id && selectedIds.has(lead.id))}
                            onChange={() => lead.id && toggleSelect(lead.id)}
                            className="h-3.5 w-3.5 accent-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium truncate max-w-[160px]">{lead.name}</p>
                          {lead.address && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{lead.address}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground capitalize">{lead.category || "—"}</td>
                        <td className="px-3 py-2.5">
                          {lead.rating != null ? (
                            <span className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 text-amber-400" />{lead.rating.toFixed(1)}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                            <select
                              value={lead.status ?? "lead"}
                              onChange={(e) => lead.id && onChangeStatus(lead.id, e.target.value as ClientStatus)}
                              className="h-6 rounded border border-border bg-background px-1.5 text-[10px] font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="lead">Lead</option>
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium ${lead.has_website ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {lead.has_website ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => lead.id && onDelete(lead.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {activeLead && (
          <div className="hidden md:flex w-72 shrink-0 flex-col rounded-xl border bg-card overflow-hidden">
            <LeadDetailPanel
              lead={activeLead}
              onClose={() => setActiveLead(null)}
              onUpdate={(id, changes) => {
                onUpdateLead(id, changes);
                setActiveLead((prev) => prev ? { ...prev, ...changes } : prev);
              }}
            />
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-lg shrink-0">
          <span className="shrink-0 text-xs font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={bulkLoading} onClick={() => setShowEmailComposer(true)}>
            <Mail className="h-3 w-3" /> Email
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={bulkLoading} onClick={handleBulkDelete}>
            <Trash2 className="mr-1 h-3 w-3" /> Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto" onClick={clearSelection}>✕</Button>
        </div>
      )}

      {showEmailComposer && (
        <EmailComposerDialog leads={selectedLeads} onClose={() => setShowEmailComposer(false)} onSent={clearSelection} />
      )}
    </div>
  );
}
