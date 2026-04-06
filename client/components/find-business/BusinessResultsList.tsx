import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Client, ClientStatus } from "@/services/businessService";
import { BusinessCard } from "./BusinessCard";

export interface BusinessResultsListProps {
  leads: Client[];
  isLoading?: boolean;
  selectedLeadId?: string | null;
  onSelectLead?: (client: Client) => void;
  onChangeStatus?: (id: string, status: ClientStatus) => void;
  onDelete?: (id: string) => void;
  onBulkChangeStatus?: (ids: string[], status: ClientStatus) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  stats: { total: number; withoutWebsite: number; withWebsite: number };
}

export function BusinessResultsList({
  leads,
  isLoading,
  selectedLeadId,
  onSelectLead,
  onChangeStatus,
  onDelete,
  onBulkChangeStatus,
  onBulkDelete,
  stats,
}: BusinessResultsListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ClientStatus>("lead");
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((c) => c.id!).filter(Boolean)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatus = async () => {
    if (!onBulkChangeStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await onBulkChangeStatus(Array.from(selectedIds), bulkStatus);
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} selected business${count > 1 ? "es" : ""}?`)) return;
    setBulkLoading(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      clearSelection();
    } finally {
      setBulkLoading(false);
    }
  };

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0;
  const hasBulk = !!(onBulkChangeStatus || onBulkDelete);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
          <span className="text-sm font-bold text-foreground">{stats.total}</span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5">
          <span className="text-sm font-bold text-red-600 dark:text-red-400">{stats.withoutWebsite}</span>
          <span className="text-xs text-red-500 dark:text-red-400">no website</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5">
          <span className="text-sm font-bold text-green-600 dark:text-green-400">{stats.withWebsite}</span>
          <span className="text-xs text-green-500 dark:text-green-400">has website</span>
        </div>
      </div>

      {/* Select-all row — only shown when there are leads */}
      {leads.length > 0 && hasBulk && (
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 cursor-pointer rounded accent-primary"
            />
            {allSelected ? "Deselect all" : "Select all"}
          </label>
          {someSelected && (
            <span className="text-xs text-muted-foreground">· {selectedIds.size} selected</span>
          )}
        </div>
      )}

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col gap-3 bg-background/80 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && leads.length === 0 && (
          <div className="mt-6 rounded-xl border-2 border-dashed p-6 text-center text-xs text-muted-foreground">
            <p className="font-medium">No leads yet</p>
            <p className="mt-1">
              Enter a city and category above, then hit <span className="font-semibold">Find Leads</span>.
            </p>
          </div>
        )}

        {leads.length > 0 && (
          <ScrollArea className="h-full pr-2">
            <div className="flex flex-col gap-3 pb-4">
              {leads.map((client) => (
                <BusinessCard
                  key={client.id}
                  client={client}
                  selected={client.id === selectedLeadId}
                  isSelected={client.id ? selectedIds.has(client.id) : false}
                  onToggleSelect={
                    client.id && hasBulk ? () => toggleSelect(client.id!) : undefined
                  }
                  onSelect={() => onSelectLead?.(client)}
                  onChangeStatus={
                    onChangeStatus
                      ? (status) => client.id && onChangeStatus(client.id, status)
                      : undefined
                  }
                  onDelete={onDelete ? () => client.id && onDelete(client.id) : undefined}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Floating bulk action bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-lg">
          <span className="shrink-0 text-xs font-medium text-foreground">
            {selectedIds.size} selected
          </span>

          <div className="flex flex-1 items-center gap-1.5">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ClientStatus)}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="lost">Lost</option>
            </select>
            {onBulkChangeStatus && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={bulkLoading}
                onClick={handleBulkStatus}
              >
                Apply status
              </Button>
            )}
          </div>

          {onBulkDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={bulkLoading}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Clear selection"
            onClick={clearSelection}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}
