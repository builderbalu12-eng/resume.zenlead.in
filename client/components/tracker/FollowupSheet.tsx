import { useEffect, useRef, useState } from "react";
import { Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api";

// ── Types ──────────────────────────────────────────────────

export type UrgencyLevel = "URGENT" | "OVERDUE" | "WAITING" | "NOT_YET";

interface FollowupData {
  emailDraft: string;
  linkedinDraft: string;
  daysSinceApplied: number;
  urgency: UrgencyLevel;
}

interface Props {
  appId: string;
  jobTitle: string;
  company: string;
  urgency: UrgencyLevel;
  open: boolean;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  URGENT:  "bg-red-100 text-red-700",
  OVERDUE: "bg-orange-100 text-orange-700",
  WAITING: "bg-yellow-100 text-yellow-700",
  NOT_YET: "bg-slate-100 text-slate-600",
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  URGENT:  "Urgent",
  OVERDUE: "Overdue",
  WAITING: "Waiting",
  NOT_YET: "Not yet",
};

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  } catch {
    toast.error("Failed to copy");
  }
}

// ── Component ──────────────────────────────────────────────

export function FollowupSheet({
  appId,
  jobTitle,
  company,
  urgency,
  open,
  onClose,
}: Props) {
  const [data, setData] = useState<FollowupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isCredits: boolean } | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [linkedinDraft, setLinkedinDraft] = useState("");
  const fetchedRef = useRef(false);

  // Lazy fetch — fires only when Sheet first opens
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    setError(null);

    apiClient
      .generateFollowup(appId)
      .then((res) => {
        setData(res);
        setEmailDraft(res.emailDraft);
        setLinkedinDraft(res.linkedinDraft);
      })
      .catch((e: any) => {
        const status = e?.status ?? e?.statusCode ?? 0;
        const msg = e?.message ?? "Failed to generate follow-up";
        setError({
          message: status === 402 ? "Not enough credits to generate a follow-up." : msg,
          isCredits: status === 402,
        });
      })
      .finally(() => setLoading(false));
  }, [open, appId]);

  // Reset when closed so re-opening re-fetches (different app)
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setData(null);
      setError(null);
      setLoading(false);
      fetchedRef.current = false;
      onClose();
    }
  }

  const linkedinOver = linkedinDraft.length > 300;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-snug truncate">
                {jobTitle}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{company}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${URGENCY_STYLES[urgency]}`}
            >
              {URGENCY_LABELS[urgency]}
            </span>
          </div>
          {data && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.daysSinceApplied} day{data.daysSinceApplied !== 1 ? "s" : ""} since you applied
            </p>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Generating follow-up…</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-5 text-center space-y-2">
              <p className="text-sm text-destructive font-medium">{error.message}</p>
              {error.isCredits && (
                <a
                  href="/pricing"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Top up credits →
                </a>
              )}
            </div>
          )}

          {data && !loading && (
            <Tabs defaultValue="email">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="email" className="flex-1">Email Draft</TabsTrigger>
                <TabsTrigger value="linkedin" className="flex-1">LinkedIn Message</TabsTrigger>
              </TabsList>

              {/* Email tab */}
              <TabsContent value="email" className="space-y-3 mt-0">
                <Textarea
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  rows={10}
                  className="resize-none text-sm font-mono leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {wordCount(emailDraft)} / 120 words
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8"
                    onClick={() => copyToClipboard(emailDraft, "Email")}
                  >
                    <Copy className="size-3.5" />
                    Copy Email
                  </Button>
                </div>
              </TabsContent>

              {/* LinkedIn tab */}
              <TabsContent value="linkedin" className="space-y-3 mt-0">
                <Textarea
                  value={linkedinDraft}
                  onChange={(e) => setLinkedinDraft(e.target.value.slice(0, 300))}
                  rows={6}
                  className={`resize-none text-sm leading-relaxed ${linkedinOver ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  placeholder="LinkedIn message (max 300 characters)"
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      linkedinOver ? "text-red-600 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {linkedinDraft.length} / 300
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8"
                    onClick={() => copyToClipboard(linkedinDraft, "Message")}
                  >
                    <Copy className="size-3.5" />
                    Copy Message
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
