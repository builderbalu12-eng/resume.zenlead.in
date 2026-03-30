import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client, ClientStatus } from "@/services/businessService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as QRCode from "qrcode";

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
  return digits;
}

function buildVCard(client: Client, digits: string) {
  const safeName = (client.name || "Business").replace(/\n/g, " ").trim();
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${safeName}`,
    `TEL;TYPE=CELL:${digits}`,
    "END:VCARD",
  ].join("\n");
}

export function BusinessCard({
  client,
  selected,
  onSelect,
  onChangeStatus,
  onDelete,
}: BusinessCardProps) {
  const digits = formatPhone(client.phone);
  const waUrl = digits ? `https://wa.me/${digits}` : null;
  const hasWebsite = Boolean(client.has_website || client.website);
  const status = client.status || "lead";
  const [callOpen, setCallOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const openCallDialog = async () => {
    if (!digits) return;
    setCallOpen(true);
    if (qrUrl) return;
    setQrLoading(true);
    try {
      const vCard = buildVCard(client, digits);
      const url = await QRCode.toDataURL(vCard, { margin: 1, width: 220 });
      setQrUrl(url);
    } catch (e) {
      console.error("Failed to generate QR", e);
      setQrUrl(null);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <Card
      className={`cursor-pointer border transition-all ${
        selected
          ? "border-primary shadow-lg"
          : "hover:border-primary/60 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="space-y-3 p-4 pb-2">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold leading-tight md:text-base">
            {client.name || "Unnamed Business"}
          </CardTitle>

          {hasWebsite ? (
            <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
              Has Website
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
              No Website
            </span>
          )}
        </div>

        {/* Second row */}
        <div className="flex flex-wrap items-center gap-2">
          {client.category && (
            <Badge variant="outline" className="rounded-full text-[11px] font-medium">
              {client.category}
            </Badge>
          )}
          {client.rating != null && (
            <span className="text-xs text-muted-foreground">
              ⭐ {client.rating.toFixed(1)}
              {client.rating_count ? ` (${client.rating_count}+)` : ""}
            </span>
          )}
        </div>

        {/* Third row */}
        {client.address && (
          <p className="text-xs text-muted-foreground line-clamp-2">{client.address}</p>
        )}
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3 p-4 pt-2">
        <div className="flex items-center gap-2">
          {onChangeStatus && (
            <select
              value={status}
              onChange={(e) => {
                e.stopPropagation();
                onChangeStatus(e.target.value as ClientStatus);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-xs font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="lost">Lost</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {waUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={(e) => {
                e.stopPropagation();
                window.open(waUrl, "_blank");
              }}
            >
              💬 WhatsApp
            </Button>
          )}
          {digits && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9"
              onClick={(e) => {
                e.stopPropagation();
                openCallDialog();
              }}
            >
              📞 Call
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              🗑️ Delete
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Call {client.name}</DialogTitle>
            <DialogDescription>
              Scan the QR code on your mobile to add the contact and call.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <div className="w-full rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="mt-1 font-mono text-sm">{client.phone || digits}</p>
            </div>

            <div className="rounded-xl border bg-background p-3">
              {qrLoading ? (
                <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-muted" />
              ) : qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR code to add contact"
                  className="h-[220px] w-[220px]"
                />
              ) : (
                <div className="h-[220px] w-[220px] rounded-lg bg-muted/50 grid place-items-center text-xs text-muted-foreground">
                  Unable to generate QR
                </div>
              )}
            </div>

            {digits && (
              <div className="flex w-full gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = `tel:${digits}`;
                  }}
                >
                  Call on this device
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

