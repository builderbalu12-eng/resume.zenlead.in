import { useState, useMemo } from "react";
import {
  LayoutGrid, TableIcon, Mail, Trash2, ChevronRight,
  Star, Globe, Phone, MapPin, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Client, ClientStatus } from "@/services/businessService";
import { EmailComposerDialog } from "./EmailComposerDialog";
import { LeadDetailPanel } from "./LeadDetailPanel";

interface LeadsCRMBoardProps {
  leads: Client[];
  isLoading?: boolean;
  onChangeStatus: (id: string, status: ClientStatus) => void;
  onDelete: (id: string) => void;
  onBulkChangeStatus: (ids: string[], status: ClientStatus) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onUpdateLead: (id: string, changes: Partial<Client>) => void;
}

const COLUMNS: { status: ClientStatus; label: string; description: string; color: string; headerColor: string }[] = [
  {
    status: "lead",
    label: "Lead",
    description: "Not contacted yet",
    color: "border-amber-300 dark:border-amber-700",
    headerColor: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  },
  {
    status: "active",
    label: "Active",
    description: "In conversation",
    color: "border-green-300 dark:border-green-700",
    headerColor: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Converted to client",
    color: "border-blue-300 dark:border-blue-700",
    headerColor: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  },
  {
    status: "lost",
    label: "Lost",
    description: "Declined / no interest",
    color: "border-red-300 dark:border-red-700",
    headerColor: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  },
];

type ViewMode = "kanban" | "table";

function KanbanCard({
  lead,
  onChangeStatus,
  onDelete,
  onSelect,
  selected,
  onToggleSelect,
}: {
  lead: Client;
  onChangeStatus: (status: ClientStatus) => void;
  onDelete: () => void;
  onSelect: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div
      className={`group rounded-xl border bg-card p-3 shadow-sm transition-all cursor-pointer hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1" onClick={onSelect}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 h-3.5 w-3.5 cursor-pointer rounded accent-primary shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug truncate">{lead.name}</p>
            {lead.category && (
              <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                <Tag className="h-2.5 w-2.5" />
                {lead.category}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground" onClick={onSelect}>
        {lead.address && (
          <div className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.address}</span>
          </div>
        )}
        {lead.rating != null && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 shrink-0 text-amber-400" />
            <span>{lead.rating.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Globe className="h-3 w-3 shrink-0" />
          <span className={lead.has_website ? "text-green-600 dark:text-green-400" : "text-red-500"}>
            {lead.has_website ? "Has website" : "No website"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <select
          value={lead.status ?? "lead"}
          onChange={(e) => onChangeStatus(e.target.value as ClientStatus)}
          className="h-6 flex-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium focus-visible:outline-none"
        >
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="lost">Lost</option>
        </select>
        <button onClick={onSelect} className="shrink-0 rounded p-0.5 hover:bg-muted">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
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
    const map: Record<ClientStatus, Client[]> = { lead: [], active: [], completed: [], lost: [] };
    for (const lead of leads) {
      const s = (lead.status ?? "lead") as ClientStatus;
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
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} leads?`)) return;
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
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {leads.length} total lead{leads.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              view === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              view === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Main content + detail panel */}
      <div className={`flex-1 overflow-hidden flex gap-3 min-h-0 ${activeLead ? "md:grid md:grid-cols-[1fr_320px]" : ""}`}>
        {/* Kanban / Table */}
        <div className="flex-1 overflow-auto">
          {view === "kanban" ? (
            <div className="grid h-full grid-cols-2 gap-3 lg:grid-cols-4">
              {COLUMNS.map((col) => {
                const colLeads = grouped[col.status];
                return (
                  <div key={col.status} className={`flex flex-col rounded-xl border-2 ${col.color} bg-background`}>
                    <div className={`rounded-t-xl px-3 py-2.5 ${col.headerColor}`}>
                      <p className="text-sm font-semibold">{col.label}</p>
                      <p className="text-[10px] opacity-70">{col.description}</p>
                      <span className="mt-1 inline-block rounded-full bg-white/30 dark:bg-black/20 px-2 py-0.5 text-[10px] font-bold">
                        {colLeads.length}
                      </span>
                    </div>
                    <ScrollArea className="flex-1 px-2 py-2">
                      <div className="flex flex-col gap-2 pb-2">
                        {colLeads.map((lead) => (
                          <KanbanCard
                            key={lead.id}
                            lead={lead}
                            onChangeStatus={(s) => lead.id && onChangeStatus(lead.id, s)}
                            onDelete={() => lead.id && onDelete(lead.id)}
                            onSelect={() => setActiveLead(lead)}
                            selected={!!(lead.id && selectedIds.has(lead.id))}
                            onToggleSelect={() => lead.id && toggleSelect(lead.id)}
                          />
                        ))}
                        {colLeads.length === 0 && (
                          <p className="px-2 py-4 text-center text-[10px] text-muted-foreground">No leads</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table view */
            <div className="rounded-xl border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-2.5 pl-4 pr-2 text-left">
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
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
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
                      <td className="px-3 py-2.5">
                        <span className="capitalize text-xs text-muted-foreground">{lead.category}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {lead.rating != null ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 text-amber-400" />
                            {lead.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
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
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-medium ${lead.has_website ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                          {lead.has_website ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => lead.id && onDelete(lead.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {activeLead && (
          <div className="hidden md:flex w-80 shrink-0 flex-col rounded-xl border bg-card overflow-hidden">
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
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-lg">
          <span className="shrink-0 text-xs font-medium">{selectedIds.size} selected</span>

          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            disabled={bulkLoading}
            onClick={() => setShowEmailComposer(true)}
          >
            <Mail className="h-3 w-3" />
            Email
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={bulkLoading}
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>

          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto" onClick={clearSelection}>
            ✕
          </Button>
        </div>
      )}

      {showEmailComposer && (
        <EmailComposerDialog
          leads={selectedLeads}
          onClose={() => setShowEmailComposer(false)}
          onSent={clearSelection}
        />
      )}
    </div>
  );
}
