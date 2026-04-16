import { Loader2, RefreshCw } from "lucide-react";
import { apiClient } from "@/services/api";

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
}): Promise<JobEvaluationResult> {
  const res = await apiClient.evaluateJob(params);
  return res.data as JobEvaluationResult;
}

// ── Panel ─────────────────────────────────────────────────

interface Props {
  result: JobEvaluationResult;
  loading?: boolean;
}

export function JobEvaluationPanel({ result, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Evaluating job…
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-4 pt-3 border-t bg-muted/10">
      {/* Overall */}
      <div className="flex items-center gap-4">
        <OverallGradeBadge grade={result.overallGrade} score={result.overallScore} />
        <div>
          <p className="text-sm font-semibold leading-tight">
            {result.overallGrade} · {result.overallScore.toFixed(1)}/5
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{result.verdict}</p>
          {result.cached && (
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <RefreshCw className="size-2.5" />
              Cached — no credits spent
            </span>
          )}
        </div>
      </div>

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
    </div>
  );
}
