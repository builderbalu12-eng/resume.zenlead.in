import { useState } from "react";
import { MessageCircle, Phone, Trash2, Mail, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client, ClientStatus } from "@/services/businessService";
import { businessService } from "@/services/businessService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailComposerDialog } from "./EmailComposerDialog";
import * as QRCode from "qrcode";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  lead:      "border-amber-400  bg-amber-50   text-amber-700  dark:bg-amber-900/30  dark:text-amber-300",
  active:    "border-green-400  bg-green-50   text-green-700  dark:bg-green-900/30  dark:text-green-300",
  completed: "border-blue-400   bg-blue-50    text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
  lost:      "border-red-400    bg-red-50     text-red-700    dark:bg-red-900/30    dark:text-red-300",
};

export interface BusinessCardProps {
  client: Client;
  selected?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
  isSelected,
  onToggleSelect,
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

  const [showEmail, setShowEmail] = useState(false);

  const [insight, setInsight] = useState<string | null>(client.ai_insight ?? null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

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

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.id) return;

    // If already have insight, just toggle visibility
    if (insight) {
      setShowInsight((v) => !v);
      return;
    }

    setLoadingInsight(true);
    setShowInsight(true);
    try {
      const res = await businessService.analyzeLead(client.id);
      setInsight(res.insight);
      if (!res.cached) toast.success("AI insight generated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate insight");
      setShowInsight(false);
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <>
      <Card
        className={`group relative cursor-pointer border transition-all ${
          selected
            ? "border-primary shadow-lg"
            : "hover:border-primary/60 hover:shadow-md"
        }`}
        onClick={onSelect}
      >
        <CardHeader className="space-y-3 p-4 pb-2">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            {onToggleSelect && (
              <div
                className={`mt-0.5 shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              >
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => {}}
                  className="h-4 w-4 cursor-pointer rounded accent-primary"
                />
              </div>
            )}
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

        <CardContent className="flex flex-col gap-2 p-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onChangeStatus && (
                <select
                  value={status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onChangeStatus(e.target.value as ClientStatus);
                  }}
                  className={`h-8 rounded-full border px-2.5 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${STATUS_STYLES[status] ?? STATUS_STYLES.lead}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="lost">Lost</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Analyze button */}
              {client.id && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 ${insight ? "text-purple-500" : "text-muted-foreground hover:text-purple-500"}`}
                  title="AI Analyze"
                  onClick={handleAnalyze}
                  disabled={loadingInsight}
                >
                  {loadingInsight ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : insight && showInsight ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              {/* Email button */}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                title={client.email ? "Send Email" : "No email on file"}
                disabled={!client.email}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmail(true);
                }}
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
              {waUrl && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  title="WhatsApp"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(waUrl, "_blank");
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              )}
              {digits && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  title="Call"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCallDialog();
                  }}
                >
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${client.name ?? "this business"}"?`)) {
                      onDelete();
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Inline AI insight panel */}
          {showInsight && (
            <div
              className="rounded-lg border border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/20 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3 w-3 text-purple-500 shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                  AI Insight
                </p>
              </div>
              {loadingInsight ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
              )}
            </div>
          )}
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
                    onClick={() => { window.location.href = `tel:${digits}`; }}
                  >
                    Call on this device
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Card>

      {showEmail && (
        <EmailComposerDialog
          leads={[client]}
          onClose={() => setShowEmail(false)}
        />
      )}
    </>
  );
}
