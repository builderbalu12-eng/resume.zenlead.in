import { useCallback, useEffect, useMemo, useState } from "react";
import { businessService, type Client, type ClientStatus } from "@/services/businessService";

export type BusinessFilters = {
  has_website?: boolean | undefined;
  status?: ClientStatus | "";
  rating_min?: number;
  source?: string;
  sort?: "newest" | "rating" | "name";
};

export type SearchParams = {
  city: string;
  category: string;
  radius_km: number;
  limit?: number;
};

export function useBusinessSearch() {
  const [leads, setLeads] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Client | null>(null);
  const [filters, setFilters] = useState<BusinessFilters>({
    has_website: undefined,
    status: "",
    rating_min: 0,
    source: "",
    sort: "newest",
  });
  const [searchParams, setSearchParams] = useState<SearchParams>({
    city: "",
    category: "",
    radius_km: 5,
  });
  const [showingHistory, setShowingHistory] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const res = await businessService.listClients({ source: "google_maps", limit: 100 });
        const items = (res as any)?.data?.items ?? res?.items ?? [];
        const normalized = items.map((c: Client) => ({ ...c, id: c.id || c._id }));
        setLeads(normalized);
        setShowingHistory(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const search = useCallback(
    async (params: SearchParams) => {
      if (!params.city || !params.category) {
        setError("Please enter a city and category");
        return;
      }

      setIsLoading(true);
      setError(null);
      setSearchParams(params);

      try {
        const results = await businessService.findLeads(params as any);
        const normalized = (results || []).map((c) => ({ ...c, id: c.id || c._id }));
        setLeads(normalized);
        setSelectedLead(normalized[0] ?? null);
        const creditsUsed =
          (results as any)?.data?.credits_used ?? (results as any)?.credits_used ?? 0;
        if (creditsUsed) {
          // eslint-disable-next-line no-console
          console.log(`Credits used: ${creditsUsed}`);
        }
        setShowingHistory(false);
      } catch (err: any) {
        setError(err?.message || "Failed to find leads");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateFilters = useCallback((partial: Partial<BusinessFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateLeadStatus = useCallback(async (id: string, status: ClientStatus) => {
    try {
      const updated = await businessService.updateClient(id, { status });
      setLeads((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
    } catch (err) {
      console.error("Failed to update client status", err);
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await businessService.deleteClient(id);
      setLeads((prev) => prev.filter((c) => c.id !== id));
      setSelectedLead((prev) => (prev && prev.id === id ? null : prev));
    } catch (err) {
      console.error("Failed to delete client", err);
      throw err;
    }
  }, []);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (filters.has_website !== undefined) {
      result = result.filter((c) => Boolean(c.has_website) === filters.has_website);
    }

    if (filters.status && filters.status !== "") {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.rating_min && filters.rating_min > 0) {
      result = result.filter((c) => (c.rating ?? 0) >= filters.rating_min!);
    }

    if (filters.source) {
      result = result.filter((c) => c.source === filters.source);
    }

    if (filters.sort === "rating") {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (filters.sort === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (filters.sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || b.updated_at || 0).getTime() -
          new Date(a.created_at || a.updated_at || 0).getTime(),
      );
    }

    return result;
  }, [leads, filters]);

  const stats = useMemo(() => {
    const total = leads.length;
    const withoutWebsite = leads.filter((c) => !c.has_website).length;
    const withWebsite = total - withoutWebsite;
    return { total, withoutWebsite, withWebsite };
  }, [leads]);

  return {
    leads,
    filteredLeads,
    isLoading,
    error,
    selectedLead,
    setSelectedLead,
    filters,
    updateFilters,
    searchParams,
    search,
    updateLeadStatus,
    deleteLead,
    stats,
    showingHistory,
  };
}

