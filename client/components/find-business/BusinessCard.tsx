import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client, ClientStatus } from "@/services/businessService";

export interface BusinessCardProps {
  client: Client;
  selected?: boolean;
  onSelect?: () => void;
  onChangeStatus?: (status: ClientStatus) => void;
  onDelete?: () => void;
}

function formatPhone(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function BusinessCard({
  client,
  selected,
  onSelect,
  onChangeStatus,
  onDelete,
}: BusinessCardProps) {
  const waUrl = formatPhone(client.phone);
  const hasWebsite = Boolean(client.has_website || client.website);
  const status = client.status || "lead";

  return (
    <Card
      className={`cursor-pointer border transition-shadow ${
        selected ? "border-primary shadow-lg" : "hover:border-primary/60 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              {client.name || "Unnamed Business"}
              {client.category && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {client.category}
                </Badge>
              )}
            </CardTitle>
            {client.rating != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                ⭐ {client.rating.toFixed(1)}{" "}
                {client.rating_count ? `(${client.rating_count}+ reviews)` : null}
              </p>
            )}
          </div>
          <div className="text-xs">
            {hasWebsite ? (
              <Badge variant="outline" className="border-green-500 text-green-600">
                🟢 Has Website
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-600">
                🔴 No Website
              </Badge>
            )}
          </div>
        </div>

        {client.address && (
          <p className="text-xs text-muted-foreground line-clamp-2">{client.address}</p>
        )}

        <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
          {client.phone && <Badge variant="outline">📞 {client.phone}</Badge>}
          {client.source && <Badge variant="outline">{client.source}</Badge>}
          {!hasWebsite && <Badge variant="outline">no-website</Badge>}
          {client.tags?.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-2 pt-0">
        {waUrl && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              window.open(waUrl, "_blank");
            }}
          >
            💬 WhatsApp
          </Button>
        )}

        {onChangeStatus && (
          <select
            value={status}
            onChange={(e) => {
              e.stopPropagation();
              onChangeStatus(e.target.value as ClientStatus);
            }}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="lost">Lost</option>
          </select>
        )}

        {onDelete && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            🗑️ Delete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

