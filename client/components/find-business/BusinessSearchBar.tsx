import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "restaurant",
  "jeweler",
  "salon",
  "gym",
  "clinic",
  "clothing",
  "bakery",
  "hotel",
  "realestate",
  "carrepair",
];

const RADII = [1, 2, 5, 10, 20, 50];

export interface BusinessSearchBarProps {
  isLoading?: boolean;
  onSearch: (params: { city: string; category: string; radius_km: number }) => void;
  searchLimit: number;
  onChangeSearchLimit: (value: number) => void;
  costPerLead: number | null;
  isCostLoading?: boolean;
}

export function BusinessSearchBar({
  isLoading,
  onSearch,
  searchLimit,
  onChangeSearchLimit,
  costPerLead,
  isCostLoading,
}: BusinessSearchBarProps) {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string>("jeweler");
  const [radius, setRadius] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !category) return;
    onSearch({ city, category, radius_km: radius });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center"
    >
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">City / Area</label>
        <Input
          placeholder="Enter city e.g. Karol Bagh, Delhi"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Radius</label>
        <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADII.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Leads</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={50}
            value={searchLimit}
            onChange={(e) =>
              onChangeSearchLimit(Math.min(50, Math.max(1, Number(e.target.value) || 0)))
            }
            className="w-20 rounded-md border bg-background px-3 py-2 text-sm text-center"
            placeholder="10"
          />
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {isCostLoading ? (
              <span>Fetching cost...</span>
            ) : costPerLead && costPerLead > 0 ? (
              <>
                leads ={" "}
                <span className="font-semibold text-primary">
                  {searchLimit * costPerLead} credits
                </span>
                <span className="ml-1 text-[11px] text-muted-foreground">
                  ({costPerLead} credits per lead)
                </span>
              </>
            ) : (
              <span className="text-[11px]">Cost info unavailable</span>
            )}
          </span>
        </div>
      </div>

      <Button type="submit" className="mt-1 w-full md:mt-5 md:w-auto" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 animate-spin" />
            Finding leads…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Leads
          </span>
        )}
      </Button>
    </form>
  );
}

