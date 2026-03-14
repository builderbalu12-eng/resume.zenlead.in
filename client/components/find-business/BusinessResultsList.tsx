import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client, ClientStatus } from "@/services/businessService";
import { BusinessCard } from "./BusinessCard";

export interface BusinessResultsListProps {
  leads: Client[];
  isLoading?: boolean;
  selectedLeadId?: string | null;
  onSelectLead?: (client: Client) => void;
  onChangeStatus?: (id: string, status: ClientStatus) => void;
  onDelete?: (id: string) => void;
  stats: { total: number; withoutWebsite: number; withWebsite: number };
}

export function BusinessResultsList({
  leads,
  isLoading,
  selectedLeadId,
  onSelectLead,
  onChangeStatus,
  onDelete,
  stats,
}: BusinessResultsListProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground">{stats.total}</span> businesses found ·{" "}
          <span className="font-semibold text-foreground">{stats.withoutWebsite}</span> without
          website ·{" "}
          <span className="font-semibold text-foreground">{stats.withWebsite}</span> with website
        </div>
      </div>

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
    </div>
  );
}

