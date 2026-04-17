const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "")
).replace(/\/$/, "");

function getAccessToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token")
  );
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("Network error. Please try again.");
  }

  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      res.statusText;
    throw new Error(detail || "Request failed");
  }

  return data as T;
}

export type ClientStatus = "lead" | "active" | "completed" | "lost" | string;

export interface Client {
  id?: string;
  _id?: string;
  name: string;
  lat?: number;
  lng?: number;
  has_website?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  rating_count?: number;
  category?: string;
  status?: string;
  source?: string;
  tags?: string[];
  website?: string | null;
  company?: string;
  notes?: string;
  ai_insight?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FindLeadsInput {
  city: string;
  category: string;
  radius_km: number;
  limit?: number;
}

export interface FindLeadsResponse {
  clients?: Client[];
  leads?: Client[];
  items?: Client[];
  data?: { items?: Client[]; leads?: Client[]; clients?: Client[] };
}

export const businessService = {
  async findLeads(input: FindLeadsInput): Promise<Client[]> {
    const url = `${API_BASE_URL}/api/clients/find-leads`;

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null);

    return data?.data?.leads || data?.leads || [];
  },

  async listClients(params: {
    category?: string;
    status?: ClientStatus;
    has_website?: boolean;
    source?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<{ items: Client[]; total?: number }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();
    return request(`/api/clients${query ? `?${query}` : ""}`, {
      method: "GET",
      auth: true,
    });
  },

  async getNearby(input: {
    lat: number;
    lng: number;
    radius_km: number;
    category?: string;
    has_website?: boolean;
  }): Promise<{ items: Client[]; total?: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set("lat", String(input.lat));
    searchParams.set("lng", String(input.lng));
    searchParams.set("radius_km", String(input.radius_km));
    if (input.category) searchParams.set("category", input.category);
    if (input.has_website !== undefined) {
      searchParams.set("has_website", String(input.has_website));
    }

    return request(`/api/clients/nearby?${searchParams.toString()}`, {
      method: "GET",
      auth: true,
    });
  },

  async searchClients(q: string): Promise<Client[]> {
    const searchParams = new URLSearchParams();
    searchParams.set("q", q);
    const data = await request<{ items?: Client[]; clients?: Client[]; data?: { items?: Client[] } }>(
      `/api/clients/search?${searchParams.toString()}`,
      { method: "GET", auth: true },
    );

    return data.items || data.clients || data.data?.items || [];
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    return request(`/api/clients/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(data),
    });
  },

  async deleteClient(id: string): Promise<{ success?: boolean }> {
    return request(`/api/clients/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  async analyzeLead(id: string): Promise<{ success: boolean; insight: string; cached: boolean }> {
    return request(`/api/clients/${id}/analyze`, { method: "POST", auth: true });
  },

  async getFindLeadsCost(): Promise<{ cost_per_unit: number; unit: string }> {
    const data = await request<{
      success?: boolean;
      feature?: string;
      cost_per_unit?: number;
      unit?: string;
    }>("/api/clients/credits/find-leads", {
      method: "GET",
      auth: true,
    });

    return {
      cost_per_unit: data.cost_per_unit ?? 0,
      unit: data.unit ?? "per lead",
    };
  },
};

