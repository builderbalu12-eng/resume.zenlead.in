import { useState } from "react";
import { Mail, X, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/services/businessService";
import { apiClient } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EmailComposerDialogProps {
  leads: Client[];
  onClose: () => void;
  onSent?: () => void;
}

const TEMPLATES = [
  {
    name: "No Website Pitch",
    subject: "Quick question for {business_name}",
    body: `Hi {business_name},

I came across your business on Google Maps and noticed you don't have a website yet.

In today's market, a professional website can significantly increase your visibility, attract more customers, and set you apart from competitors.

I'd love to offer you a free consultation to discuss how a simple, affordable website could help your business grow.

Would you be open to a quick 10-minute call?

Best regards,
{your_name}`,
  },
  {
    name: "Follow-up",
    subject: "Following up — {business_name}",
    body: `Hi {business_name},

I wanted to follow up on my previous message. I understand you're busy, but I genuinely believe I can help your business get more customers online.

I'd be happy to show you some examples of what I've done for similar businesses in {address}.

Would this week work for a brief call?

Best,
{your_name}`,
  },
  {
    name: "Custom",
    subject: "",
    body: "",
  },
];

export function EmailComposerDialog({ leads, onClose, onSent }: EmailComposerDialogProps) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [recipients, setRecipients] = useState<Client[]>(leads);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const gmailConnected = user?.gmail_connected ?? false;
  const gmailEmail = user?.gmail_email;

  const leadsWithEmail = recipients.filter((l) => l.email);
  const leadsWithoutEmail = recipients.filter((l) => !l.email);

  const previewLead = leadsWithEmail[0] ?? recipients[0];

  const personalize = (text: string, lead: Client) =>
    text
      .replace(/{business_name}/g, lead.name ?? "")
      .replace(/{name}/g, lead.name ?? "")
      .replace(/{address}/g, lead.address ?? "")
      .replace(/{category}/g, lead.category ?? "")
      .replace(/{your_name}/g, `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim());

  const handleTemplateChange = (idx: number) => {
    setSelectedTemplate(idx);
    if (TEMPLATES[idx].subject) setSubject(TEMPLATES[idx].subject);
    if (TEMPLATES[idx].body) setBody(TEMPLATES[idx].body);
  };

  const handleRemoveLead = (id: string) => {
    setRecipients((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSend = async () => {
    if (!gmailConnected) {
      toast.error("Connect Gmail first in Settings → Gmail for Lead Emails");
      return;
    }
    if (leadsWithEmail.length === 0) {
      toast.error("None of the selected leads have an email address");
      return;
    }
    setSending(true);
    try {
      const result = await apiClient.sendLeadsEmail({
        lead_ids: leadsWithEmail.map((l) => l.id!).filter(Boolean),
        subject,
        body_template: body,
        from_name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      });
      toast.success(`${result.sent} email${result.sent !== 1 ? "s" : ""} sent!`);
      if (result.failed > 0) toast.warning(`${result.failed} failed to send`);
      onSent?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Email Leads</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Gmail status */}
          {gmailConnected ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              <Mail className="h-4 w-4 shrink-0" />
              Sending from: <span className="font-medium">{gmailEmail}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Gmail not connected.{" "}
              <a href="/profile" className="underline font-medium">
                Connect in Settings
              </a>{" "}
              to send emails.
            </div>
          )}

          {/* Recipients */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recipients ({recipients.length})
            </p>
            <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-2 min-h-[44px]">
              {recipients.map((lead) => (
                <span
                  key={lead.id}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    lead.email
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive line-through"
                  }`}
                >
                  {lead.name}
                  {!lead.email && <span className="text-[10px]">(no email)</span>}
                  {recipients.length > 1 && (
                    <button
                      onClick={() => handleRemoveLead(lead.id!)}
                      className="ml-0.5 rounded-full hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {leadsWithoutEmail.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {leadsWithoutEmail.length} lead{leadsWithoutEmail.length > 1 ? "s" : ""} without email will be skipped
              </p>
            )}
          </div>

          {/* Template picker */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Template</p>
            <div className="flex gap-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => handleTemplateChange(i)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTemplate === i
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</p>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject… use {business_name} for personalization"
            />
          </div>

          {/* Body / Preview */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Body</p>
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
            {showPreview ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono text-muted-foreground min-h-[200px]">
                {previewLead ? personalize(body, previewLead) : body}
              </div>
            ) : (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Write your email body… Variables: {business_name}, {address}, {category}, {your_name}"
                className="font-mono text-sm"
              />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Variables: <code>{"{business_name}"}</code>, <code>{"{address}"}</code>, <code>{"{category}"}</code>, <code>{"{your_name}"}</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {leadsWithEmail.length} of {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} have email
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSend} disabled={sending || !gmailConnected || leadsWithEmail.length === 0}>
              {sending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Send to {leadsWithEmail.length}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
