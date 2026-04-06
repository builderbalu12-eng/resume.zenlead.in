import type { BusinessFilters } from "@/hooks/useBusinessSearch";

export interface BusinessFiltersProps {
  filters: BusinessFilters;
  onChange: (partial: Partial<BusinessFilters>) => void;
}

const selectClass =
  "h-7 cursor-pointer rounded-md border border-border/70 bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:border-border transition-colors";

export function BusinessFilters({ filters, onChange }: BusinessFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/80 px-3 py-2">

      {/* Website — segmented control (all 3 options always visible) */}
      <div className="flex overflow-hidden rounded-md border border-border/70 text-xs">
        {(
          [
            { label: "All",         value: undefined   },
            { label: "No website",  value: false       },
            { label: "Has website", value: true        },
          ] as const
        ).map(({ label, value }, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange({ has_website: value })}
            className={[
              "px-2.5 py-1 transition-colors",
              i > 0 ? "border-l border-border/70" : "",
              filters.has_website === value
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status */}
      <select
        value={filters.status ?? ""}
        onChange={(e) => onChange({ status: e.target.value })}
        className={selectClass}
      >
        <option value="">Status: All</option>
        <option value="lead">Lead</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="lost">Lost</option>
      </select>

      {/* Rating */}
      <select
        value={filters.rating_min || ""}
        onChange={(e) =>
          onChange({ rating_min: e.target.value ? Number(e.target.value) : 0 })
        }
        className={selectClass}
      >
        <option value="">Rating: All</option>
        <option value="4">4+ stars</option>
        <option value="3">3+ stars</option>
      </select>

      {/* Source */}
      <select
        value={filters.source ?? ""}
        onChange={(e) => onChange({ source: e.target.value })}
        className={selectClass}
      >
        <option value="">Source: All</option>
        <option value="googlemaps">Google Maps</option>
        <option value="manual">Manual</option>
      </select>

      {/* Sort */}
      <select
        value={filters.sort ?? "newest"}
        onChange={(e) =>
          onChange({ sort: e.target.value as BusinessFilters["sort"] })
        }
        className={selectClass}
      >
        <option value="newest">Sort: Newest</option>
        <option value="rating">Sort: Rating</option>
        <option value="name">Sort: Name A–Z</option>
      </select>

    </div>
  );
}
