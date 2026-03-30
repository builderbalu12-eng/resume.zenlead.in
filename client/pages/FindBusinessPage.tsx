import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessSearch } from "@/hooks/useBusinessSearch";
import { BusinessSearchBar } from "@/components/find-business/BusinessSearchBar";
import { BusinessFilters } from "@/components/find-business/BusinessFilters";
import { BusinessMap } from "@/components/find-business/BusinessMap";
import { BusinessResultsList } from "@/components/find-business/BusinessResultsList";
import { businessService } from "@/services/businessService";

export function FindBusinessPage() {
  const {
    filteredLeads,
    isLoading,
    error,
    selectedLead,
    setSelectedLead,
    filters,
    updateFilters,
    search,
    updateLeadStatus,
    deleteLead,
    stats,
    showingHistory,
  } = useBusinessSearch();
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");
  const [searchLimit, setSearchLimit] = useState(10);
  const [costPerLead, setCostPerLead] = useState<number | null>(null);
  const [isCostLoading, setIsCostLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadCost = async () => {
      try {
        setIsCostLoading(true);
        const res = await businessService.getFindLeadsCost();
        if (!cancelled) {
          setCostPerLead(res.cost_per_unit ?? 0);
        }
      } catch {
        if (!cancelled) {
          setCostPerLead(0);
        }
      } finally {
        if (!cancelled) {
          setIsCostLoading(false);
        }
      }
    };
    loadCost();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (params: { city: string; category: string; radius_km: number }) => {
    search({ ...params, limit: searchLimit });
  };

  return (
    <Page size="xl" className="mx-0 max-w-none flex h-[calc(100vh-80px)] flex-col gap-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-sm">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold md:text-xl">Find Business Leads</h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Discover local businesses without websites and turn them into clients.
            </p>
          </div>
        </div>

        <BusinessSearchBar
          isLoading={isLoading}
          onSearch={handleSearch}
          searchLimit={searchLimit}
          onChangeSearchLimit={setSearchLimit}
          costPerLead={costPerLead}
          isCostLoading={isCostLoading}
        />
        <BusinessFilters filters={filters} onChange={updateFilters} />

        {error && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border bg-card">
        {/* Desktop layout: side-by-side */}
        <div className="hidden h-full md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="border-r">
            <BusinessMap
              leads={filteredLeads}
              selectedLead={selectedLead}
              onSelectLead={(client) => setSelectedLead(client)}
            />
          </div>
          <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
            {showingHistory ? (
              <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-1">
                📋 Showing last search results — search again to refresh
              </span>
            ) : (
              <span className="text-xs text-green-600 dark:text-green-400 rounded-full bg-green-500/10 px-2 py-1">
                ✅ Fresh results from Google Maps
              </span>
            )}
            <BusinessResultsList
              leads={filteredLeads}
              isLoading={isLoading}
              selectedLeadId={selectedLead?.id ?? null}
              onSelectLead={(client) => setSelectedLead(client)}
              onChangeStatus={updateLeadStatus}
              onDelete={deleteLead}
              stats={stats}
            />
          </div>
        </div>

        {/* Mobile layout: tabs */}
        <div className="flex h-full flex-col md:hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "map" | "list")}
            className="flex h-full flex-col"
          >
            <TabsList className="mx-3 mt-3 grid grid-cols-2">
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
            <TabsContent value="map" className="flex-1 px-0 pb-0 data-[state=inactive]:hidden">
              <div className="mt-2 h-[60vh]">
                <BusinessMap
                  leads={filteredLeads}
                  selectedLead={selectedLead}
                  onSelectLead={(client) => setSelectedLead(client)}
                />
              </div>
            </TabsContent>
            <TabsContent
              value="list"
              className="flex-1 flex flex-col gap-2 overflow-y-auto px-3 pb-3 data-[state=inactive]:hidden"
            >
              {showingHistory ? (
                <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-1">
                  📋 Showing last search results — search again to refresh
                </span>
              ) : (
                <span className="text-xs text-green-600 dark:text-green-400 rounded-full bg-green-500/10 px-2 py-1">
                  ✅ Fresh results from Google Maps
                </span>
              )}
              <BusinessResultsList
                leads={filteredLeads}
                isLoading={isLoading}
                selectedLeadId={selectedLead?.id ?? null}
                onSelectLead={(client) => setSelectedLead(client)}
                onChangeStatus={updateLeadStatus}
                onDelete={deleteLead}
                stats={stats}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Page>
  );
}

