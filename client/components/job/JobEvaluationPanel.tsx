import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ── Types ─────────────────────────────────────────────────

export interface EvaluationAxis {
  name: string;
  grade: string;
  score: number;
  reasoning: string;
}

export interface JobEvaluationResult {
  overallGrade: string;
  overallScore: number;
  verdict: string;
  axes: EvaluationAxis[];
  cached: boolean;
}

// ── Helpers ───────────────────────────────────────────────

function gradeColor(grade: string): string {
  const g = grade.charAt(0).toUpperCase();
  if (g === "A") return "bg-green-100 text-green-700 border-green-200";
  if (g === "B") return "bg-blue-100 text-blue-700 border-blue-200";
  if (g === "C") return "bg-amber-100 text-amber-700 border-amber-200";
  if (g === "D") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums min-w-[2.5rem] ${gradeColor(grade)}`}
    >
      {grade}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 5) * 100));
  let barColor = "bg-red-400";
  if (pct >= 80) barColor = "bg-green-500";
  else if (pct >= 60) barColor = "bg-blue-500";
  else if (pct >= 40) barColor = "bg-amber-400";

  return (
    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function OverallGradeBadge({ grade, score }: { grade: string; score: number }) {
  const g = grade.charAt(0).toUpperCase();
  let cls = "from-red-500 to-red-600";
  if (g === "A") cls = "from-green-500 to-emerald-600";
  else if (g === "B") cls = "from-blue-500 to-indigo-600";
  else if (g === "C") cls = "from-amber-500 to-orange-500";

  return (
    <div
      className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${cls} text-white shadow-md`}
    >
      <span className="text-2xl font-black leading-none">{grade}</span>
    </div>
  );
}

// ── Fetch ─────────────────────────────────────────────────

export async function fetchJobEvaluation(params: {
  jobUrl: string;
  jobTitle: string;
  company: string;
  description: string;
  datePosted?: string;
  salary?: string;
}): Promise<JobEvaluationResult> {
  const res = await apiClient.evaluateJob(params);
  return res.data as JobEvaluationResult;
}

// ── Compensation Section ──────────────────────────────────

interface CompensationData {
  currency: string;
  salaryRange: { min: number; median: number; max: number };
  verdict: string;
  verdictDetail: string;
  rationale: string;
  disclaimer: string;
}

const VERDICT_STYLE: Record<string, string> = {
  "below market": "bg-red-100 text-red-700 border-red-200",
  "at market":    "bg-green-100 text-green-700 border-green-200",
  "above market": "bg-blue-100 text-blue-700 border-blue-200",
  "unknown":      "bg-muted text-muted-foreground border-border",
};

function formatSalary(n: number, currency: string): string {
  if (currency === "INR") {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString("en-IN")}`;
  }
  if (n >= 1000) return `${currency === "USD" ? "$" : currency === "GBP" ? "£" : ""}${Math.round(n / 1000)}k`;
  return `${n}`;
}

function CompensationSection({
  jobTitle,
  jobLocation,
  statedSalary,
}: {
  jobTitle: string;
  jobLocation: string;
  statedSalary?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompensationData | null>(null);
  const [error, setError] = useState<{ text: string; isCredits: boolean } | null>(null);

  async function handleResearch() {
    if (data) return; // already fetched
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.researchCompensation({
        role: jobTitle,
        location: jobLocation,
        statedSalary: statedSalary || undefined,
      });
      setData(res);
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode ?? 0;
      if (status === 402) {
        setError({ text: "Not enough credits to research compensation.", isCredits: true });
      } else {
        setError({ text: e.message ?? "Research failed", isCredits: false });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !data && !loading) handleResearch();
      }}
    >
      <div className="border-t border-dashed">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/10 transition-colors text-left">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Compensation Research</span>
            {!data && !open && (
              <span className="text-[10px] text-muted-foreground">(2 credits)</span>
            )}
            {data && (
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${VERDICT_STYLE[data.verdict] ?? VERDICT_STYLE["unknown"]}`}>
                {data.verdict}
              </span>
            )}
          </div>
          {open ? <ChevronUp className="size-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {loading && (
              <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                Researching market rate…
              </div>
            )}

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
                <p className="text-destructive">{error.text}</p>
                {error.isCredits && (
                  <a href="/pricing" className="text-primary underline underline-offset-2 mt-0.5 block">
                    Top up credits →
                  </a>
                )}
              </div>
            )}

            {data && !loading && (
              <div className="space-y-3">
                {/* Salary range bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatSalary(data.salaryRange.min, data.currency)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatSalary(data.salaryRange.median, data.currency)} median
                    </span>
                    <span className="text-muted-foreground">
                      {formatSalary(data.salaryRange.max, data.currency)}
                    </span>
                  </div>
                  {/* Visual bar */}
                  <div className="relative h-3 rounded-full bg-muted overflow-visible">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300 via-green-400 to-blue-400 opacity-40" />
                    {/* Median marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded bg-foreground/60 shadow"
                      style={{ left: "50%" }}
                      title="Median"
                    />
                    {/* Stated salary marker */}
                    {statedSalary && data.verdict !== "unknown" && (() => {
                      // Try to extract a number from statedSalary string
                      const match = statedSalary.replace(/,/g, "").match(/\d+/g);
                      if (!match) return null;
                      const val = parseInt(match[0]);
                      const { min, max } = data.salaryRange;
                      const clamped = Math.min(Math.max(val, min), max);
                      const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 50;
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 rounded bg-primary shadow-md"
                          style={{ left: `${pct}%` }}
                          title={`Stated: ${statedSalary}`}
                        />
                      );
                    })()}
                  </div>
                  {statedSalary && (
                    <p className="text-[10px] text-muted-foreground">
                      <span className="inline-block w-2.5 h-2.5 rounded bg-primary/70 align-middle mr-1" />
                      Stated salary: {statedSalary}
                    </p>
                  )}
                </div>

                {/* Verdict detail */}
                {data.verdictDetail && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.verdictDetail}</p>
                )}

                {/* Rationale */}
                <p className="text-xs text-muted-foreground leading-relaxed">{data.rationale}</p>

                {/* Disclaimer */}
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t pt-2 mt-2">
                  {data.disclaimer}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ── Panel ─────────────────────────────────────────────────

interface Props {
  result: JobEvaluationResult;
  loading?: boolean;
  jobTitle?: string;
  jobLocation?: string;
  statedSalary?: string;
}

export function JobEvaluationPanel({ result, loading, jobTitle, jobLocation, statedSalary }: Props) {
  const [open, setOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm border-t bg-muted/10">
        <Loader2 className="size-4 animate-spin" />
        Evaluating job…
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-t bg-muted/10">
        {/* Header row — always visible */}
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors text-left">
          <div className="flex items-center gap-3">
            <OverallGradeBadge grade={result.overallGrade} score={result.overallScore} />
            <div>
              <p className="text-sm font-semibold leading-tight">
                {result.overallGrade} · {result.overallScore.toFixed(1)}/5
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.verdict}</p>
            </div>
          </div>
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          )}
        </CollapsibleTrigger>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Axes */}
            <div className="space-y-2">
              {(result.axes ?? []).map((axis) => (
                <div key={axis.name} className="flex items-start gap-3">
                  <GradeBadge grade={axis.grade} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{axis.name}</span>
                      <ScoreBar score={axis.score} />
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {axis.score.toFixed(1)}/5
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{axis.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Credit usage */}
            <p className="text-[10px] text-muted-foreground/60 text-right">
              {result.cached ? "Free (cached)" : "1 credit used"}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Re-export Panel with compensation section wired in
export function JobEvaluationPanelWithCompensation({
  result,
  loading,
  jobTitle,
  jobLocation,
  statedSalary,
}: Props) {
  return (
    <div>
      <JobEvaluationPanel result={result} loading={loading} />
      {result && !loading && (
        <CompensationSection
          jobTitle={jobTitle ?? result.verdict ?? ""}
          jobLocation={jobLocation ?? ""}
          statedSalary={statedSalary}
        />
      )}
    </div>
  );
}
