import { useState, useEffect } from "react";
import {
  X, Globe, Phone, MapPin, Star, Tag, Mail, ExternalLink,
  MessageSquare, Loader2, Sparkles, Calendar, StickyNote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { Client, ClientStatus } from "@/services/businessService";
import { businessService } from "@/services/businessService";
import { toast } from "sonner";
import { EmailComposerDialog } from "./EmailComposerDialog";

interface LeadDetailPanelProps {
  lead: Client;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<Client>) => void;
}

const STATUS_COLORS: Record<string, string> = {
  lead:      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  active:    "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  lost:      "bg-red-500/10 text-red-700 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  lead:      "Lead — not contacted yet",
  active:    "Active — in conversation",
  completed: "Completed — converted to client",
  lost:      "Lost — declined or not interested",
};

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [insight, setInsight] = useState<string | null>(lead.ai_insight ?? null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    setNotes(lead.notes ?? "");
    setInsight(lead.ai_insight ?? null);
  }, [lead.id]);

  const handleSaveNotes = async () => {
    if (!lead.id) return;
    setSavingNotes(true);
    try {
      await businessService.updateClient(lead.id, { notes });
      onUpdate(lead.id, { notes });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAnalyze = async () => {
    if (!lead.id) return;
    setLoadingInsight(true);
    try {
      const res = await businessService.analyzeLead(lead.id);
      setInsight(res.insight);
      onUpdate(lead.id, { ai_insight: res.insight });
      if (!res.cached) toast.success("AI insight generated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate insight");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-base font-semibold truncate">{lead.name}</h2>
            <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status ?? "lead"]}`}>
              {STATUS_LABELS[lead.status ?? "lead"]}
            </span>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Key info */}
          <div className="space-y-2 text-sm">
            {lead.address && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{lead.address}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${lead.phone}`} className="hover:text-foreground">{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${lead.email}`} className="hover:text-foreground truncate">{lead.email}</a>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 shrink-0" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground truncate flex items-center gap-1">
                  {lead.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}
            {!lead.website && (
              <div className="flex items-center gap-2 text-red-500">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">No website</span>
              </div>
            )}
            {lead.rating != null && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{lead.rating.toFixed(1)} ({lead.rating_count ?? 0} reviews)</span>
              </div>
            )}
            {lead.category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0" />
                <span className="capitalize">{lead.category}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {lead.phone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                </a>
              </Button>
            )}
            {lead.email && (
              <Button size="sm" variant="outline" onClick={() => setShowEmail(true)}>
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Send Email
              </Button>
            )}
          </div>

          {/* AI Insight */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <p className="text-sm font-medium">AI Outreach Insight</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleAnalyze}
                disabled={loadingInsight}
              >
                {loadingInsight ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {insight ? "Refresh" : "Analyze"}
              </Button>
            </div>
            {insight ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click "Analyze" to get an AI-powered outreach suggestion tailored to this business.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Notes</p>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add private notes about this lead…"
              className="resize-none text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 px-3 text-xs"
              onClick={handleSaveNotes}
              disabled={savingNotes || notes === (lead.notes ?? "")}
            >
              {savingNotes ? "Saving…" : "Save Notes"}
            </Button>
          </div>

          {/* Follow-up date */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Follow-up Date</p>
            </div>
            <Input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="text-sm"
            />
            {followUp && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 px-3 text-xs"
                onClick={async () => {
                  if (!lead.id) return;
                  try {
                    await businessService.updateClient(lead.id, { tags: [...(lead.tags ?? []), `followup:${followUp}`] });
                    toast.success("Follow-up date saved");
                  } catch {
                    toast.error("Failed to save follow-up date");
                  }
                }}
              >
                Save Follow-up
              </Button>
            )}
          </div>
        </div>
      </div>

      {showEmail && lead.email && (
        <EmailComposerDialog
          leads={[lead]}
          onClose={() => setShowEmail(false)}
        />
      )}
    </>
  );
}
