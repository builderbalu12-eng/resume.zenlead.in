import { Button } from "@/components/ui/button";
import type { BusinessFilters } from "@/hooks/useBusinessSearch";

export interface BusinessFiltersProps {
  filters: BusinessFilters;
  onChange: (partial: Partial<BusinessFilters>) => void;
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={
        active
          ? "h-8 rounded-full px-3 text-xs border-transparent text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-600"
          : "h-8 rounded-full px-3 text-xs border-border text-muted-foreground bg-background/40 hover:bg-muted/50 hover:text-foreground"
      }
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function BusinessFilters({ filters, onChange }: BusinessFiltersProps) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Website:</span>
        <Chip active={filters.has_website === undefined} onClick={() => onChange({ has_website: undefined })}>
          All
        </Chip>
        <Chip active={filters.has_website === false} onClick={() => onChange({ has_website: false })}>
          No Website ❌
        </Chip>
        <Chip active={filters.has_website === true} onClick={() => onChange({ has_website: true })}>
          Has Website ✅
        </Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Status:</span>
        <Chip active={!filters.status} onClick={() => onChange({ status: "" })}>
          All
        </Chip>
        <Chip active={filters.status === "lead"} onClick={() => onChange({ status: "lead" })}>
          Lead
        </Chip>
        <Chip active={filters.status === "active"} onClick={() => onChange({ status: "active" })}>
          Active
        </Chip>
        <Chip active={filters.status === "completed"} onClick={() => onChange({ status: "completed" })}>
          Completed
        </Chip>
        <Chip active={filters.status === "lost"} onClick={() => onChange({ status: "lost" })}>
          Lost
        </Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Rating:</span>
        <Chip active={!filters.rating_min} onClick={() => onChange({ rating_min: 0 })}>
          All
        </Chip>
        <Chip active={filters.rating_min === 4} onClick={() => onChange({ rating_min: 4 })}>
          4+ ⭐
        </Chip>
        <Chip active={filters.rating_min === 3} onClick={() => onChange({ rating_min: 3 })}>
          3+ ⭐
        </Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Source:</span>
        <Chip active={!filters.source} onClick={() => onChange({ source: "" })}>
          All
        </Chip>
        <Chip
          active={filters.source === "googlemaps"}
          onClick={() => onChange({ source: "googlemaps" })}
        >
          Google Maps
        </Chip>
        <Chip active={filters.source === "manual"} onClick={() => onChange({ source: "manual" })}>
          Manual
        </Chip>

        <span className="ml-2 mr-1 hidden text-xs font-semibold text-muted-foreground md:inline">Sort:</span>
        <Chip active={filters.sort === "newest"} onClick={() => onChange({ sort: "newest" })}>
          Newest
        </Chip>
        <Chip active={filters.sort === "rating"} onClick={() => onChange({ sort: "rating" })}>
          Rating ↓
        </Chip>
        <Chip active={filters.sort === "name"} onClick={() => onChange({ sort: "name" })}>
          Name A–Z
        </Chip>
      </div>
      </div>
    </div>
  );
}

