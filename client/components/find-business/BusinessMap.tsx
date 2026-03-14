import { memo, useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Client } from "@/services/businessService";

export interface BusinessMapProps {
  leads: Client[];
  selectedLead: Client | null;
  onSelectLead: (client: Client) => void;
}

const containerStyle: google.maps.MapOptions["styles"] | { width: string; height: string } = {
  width: "100%",
  height: "100%",
};

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi fallback

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  jeweler: "💍",
  salon: "💇",
  gym: "💪",
  clinic: "🏥",
  clothing: "👗",
  bakery: "🥐",
  hotel: "🏨",
  realestate: "🏠",
  carrepair: "🔧",
  default: "📍",
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "#FF5733",
  jeweler: "#FFD700",
  salon: "#FF69B4",
  gym: "#00C853",
  clinic: "#2196F3",
  clothing: "#9C27B0",
  bakery: "#FF9800",
  hotel: "#00BCD4",
  realestate: "#795548",
  carrepair: "#607D8B",
  default: "#6366F1",
};

function getMarkerIcon(client: any) {
  const color = CATEGORY_COLORS[client.category || ""] || CATEGORY_COLORS.default;
  const emoji = CATEGORY_ICONS[client.category || ""] || CATEGORY_ICONS.default;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54">
      <ellipse cx="22" cy="52" rx="8" ry="3" fill="rgba(0,0,0,0.25)"/>
      <path d="M22 2 C12 2 4 10 4 20 C4 34 22 50 22 50 C22 50 40 34 40 20 C40 10 32 2 22 2Z"
            fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="22" cy="20" r="12" fill="white" opacity="0.95"/>
      ${!client.has_website ? `<circle cx="34" cy="8" r="5" fill="#ef4444" stroke="white" stroke-width="1.5"/>` : ''}
      <text x="22" y="25" text-anchor="middle" font-size="13">${emoji}</text>
    </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(44, 54),
    anchor: new window.google.maps.Point(22, 54),
  };
}

function BusinessMapInner({ leads, selectedLead, onSelectLead }: BusinessMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const center = useMemo(() => {
    if (selectedLead?.lat && selectedLead.lng) {
      return { lat: selectedLead.lat, lng: selectedLead.lng };
    }
    const first = leads.find((l) => l.lat && l.lng);
    if (first) {
      return { lat: first.lat!, lng: first.lng! };
    }
    return DEFAULT_CENTER;
  }, [leads, selectedLead]);

  const onLoad = useCallback(
    (m: google.maps.Map) => {
      setMap(m);
      if (!leads.length) return;

      const bounds = new google.maps.LatLngBounds();
      leads.forEach((l) => {
        if (l.lat && l.lng) {
          bounds.extend({ lat: l.lat, lng: l.lng });
        }
      });
      if (!bounds.isEmpty()) {
        m.fitBounds(bounds);
      }
    },
    [leads],
  );

  const handleSelect = (client: Client) => {
    onSelectLead(client);
    if (client.lat && client.lng && map) {
      map.panTo({ lat: client.lat, lng: client.lng });
      map.setZoom(Math.max(map.getZoom() || 14, 16));
    }
  };

  const active = selectedLead || (hoveredId ? leads.find((l) => l.id === hoveredId) || null : null);

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle as any}
        center={center}
        zoom={13}
        onLoad={onLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {leads
          .filter((c) => c.lat && c.lng)
          .map((client) => (
            <>
              <Marker
                key={client.id}
                position={{ lat: client.lat!, lng: client.lng! }}
                onClick={() => {
                  setActiveMarker(client.id || null);
                  handleSelect(client);
                }}
                onMouseOver={() => setHoveredId(client.id || null)}
                onMouseOut={() => setHoveredId((prev) => (prev === client.id ? null : prev))}
                icon={getMarkerIcon(client)}
              />
              {activeMarker === client.id && (
                <InfoWindow
                  position={{ lat: client.lat!, lng: client.lng! }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div style={{ width: 220, fontFamily: "sans-serif", padding: 4 }}>
                    <strong style={{ fontSize: 13 }}>{client.name}</strong>
                    <div style={{ fontSize: 11, color: "#666", margin: "4px 0" }}>
                      {client.address}
                    </div>
                    {client.rating && (
                      <div style={{ fontSize: 12, marginBottom: 6 }}>⭐ {client.rating}</div>
                    )}
                    {client.phone && (
                      <div style={{ fontSize: 12, marginBottom: 6 }}>📞 {client.phone}</div>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${client.name || ""} ${client.address || ""}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        background: "#4285F4",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: 4,
                        textDecoration: "none",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      📍 Open in Google Maps
                    </a>
                  </div>
                </InfoWindow>
              )}
            </>
          ))}

      </GoogleMap>
      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-background/90 p-2 text-xs shadow-lg backdrop-blur">
        <p className="mb-1 font-semibold">Categories</p>
        {Object.entries(CATEGORY_COLORS)
          .filter(([k]) => k !== "default")
          .map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 capitalize">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              {cat}
            </div>
          ))}
      </div>
    </div>
  );
}

export const BusinessMap = memo(function BusinessMap(props: BusinessMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Failed to load Google Maps. Check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <BusinessMapInner {...props} />;
});

