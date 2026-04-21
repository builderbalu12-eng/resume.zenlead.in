import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Download, FileSpreadsheet, FileText, TrendingUp, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';
import { downloadResumePDF, generateResumeDocx } from '@/services/resumeGenerator';
import { JobRecommendationCard } from './JobRecommendationCard';
import { ResumeContextCard } from './ResumeContextCard';
import { FreelancerCard } from './FreelancerCard';
import { LeadCard } from './LeadCard';

interface MessageBubbleProps {
  message: ChatMessage;
  onSendMessage?: (msg: string) => void;
}

// ── Inline table (used for leads) ────────────────────────────────────────────

function InlineTable({ columns, rows }: { columns: string[]; rows: Record<string, any>[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/50 mt-2">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-muted/60">
            {columns.map((col) => (
              <th key={col} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap border-b border-border/40">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
              {columns.map((col) => {
                const val = row[col];
                const isUrl = col === 'URL' && typeof val === 'string' && val.startsWith('http');
                return (
                  <td key={col} className="px-2 py-1.5 align-top max-w-[180px] truncate">
                    {isUrl ? (
                      <a href={val} target="_blank" rel="noopener noreferrer"
                        className="text-primary inline-flex items-center gap-0.5 hover:underline">
                        Apply <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span title={String(val ?? '')}>{String(val ?? '') || '—'}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Action cards ─────────────────────────────────────────────────────────────

function JobsActionCard({ data, onSendMessage }: { data: any; onSendMessage?: (msg: string) => void }) {
  const jobs: Record<string, any>[] = data?.jobs ?? [];
  if (!jobs.length) return null;

  return (
    <div className="mt-2 space-y-0">
      {jobs.map((j, i) => (
        <JobRecommendationCard
          key={i}
          job={{
            Title:      j.Title      ?? j.title      ?? '',
            Company:    j.Company    ?? j.company    ?? '',
            Location:   j.Location   ?? j.location   ?? '',
            Experience: j.Experience ?? j.experience ?? '',
            Salary:     j.Salary     ?? j.salary     ?? '',
            Site:       j.Site       ?? j.site       ?? '',
            Type:       j.Type       ?? j.type       ?? j.job_type ?? '',
            URL:        j.URL        ?? j.url        ?? j.job_url  ?? '',
            pitch:      j.pitch      ?? '',
          }}
          index={i}
          total={jobs.length}
          onSendMessage={onSendMessage}
        />
      ))}
    </div>
  );
}

function LeadsActionCard({ data, onSendMessage }: { data: any; onSendMessage?: (msg: string) => void }) {
  const leads: Record<string, any>[] = data?.leads ?? [];
  if (!leads.length) return null;

  const city = data?.city ? ` · ${data.city}` : '';
  const cat = data?.category ? ` · ${data.category}` : '';

  return (
    <div className="mt-3 space-y-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-foreground">
            {leads.length} leads{city}{cat}
          </span>
        </div>
        <button
          onClick={() => exportToCSV(leads, `leads_${Date.now()}.csv`)}
          className="flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Download className="h-3 w-3" />
          Download CSV
        </button>
      </div>
      {leads.map((l, i) => (
        <LeadCard
          key={i}
          lead={{
            Name:           l.Name ?? l.name ?? '',
            Phone:          l.Phone ?? l.phone,
            Address:        l.Address ?? l.address,
            Website:        l.Website ?? l.website,
            'Has Website':  typeof l['Has Website'] === 'boolean' ? l['Has Website'] : l['Has Website'] === 'Yes',
            Rating:         l.Rating ?? l.rating ?? null,
            Category:       l.Category ?? l.category,
            lat:            l.lat ?? null,
            lng:            l.lng ?? null,
          }}
          onSendMessage={onSendMessage}
        />
      ))}
    </div>
  );
}

function TailoredResumeCard({ data }: { data: any }) {
  const [loadingBtn, setLoadingBtn] = useState<null | 'pdf' | 'docx'>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // ── In-progress state ────────────────────────────────────────────────────
  if (data?._progress) {
    const { step, total, label } = data._progress;
    return (
      <div className="mt-3 rounded-xl border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                n < step  ? 'bg-primary' :
                n === step ? 'bg-primary/50 animate-pulse' :
                'bg-muted',
              )}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Step {step} of {total}</p>
      </div>
    );
  }

  // ── Nothing to show yet ───────────────────────────────────────────────────
  const ats: number  = data?.ats_score ?? 0;
  const resumeData   = data?.resume_data;
  const text: string = data?.tailored_resume ?? '';
  const notes: string[] = data?.optimization_notes ?? [];
  const scoreBreakdown: Record<string, number> = data?.score_breakdown ?? {};
  const company  = data?.company  || 'Company';
  const jobTitle = data?.job_title || 'Resume';

  if (!ats && !text) return null;

  const scoreColor =
    ats >= 80 ? 'text-green-600 dark:text-green-400' :
    ats >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';

  const scoreBg =
    ats >= 80 ? 'bg-green-500' : ats >= 60 ? 'bg-amber-400' : 'bg-red-500';

  const breakdownKeys = Object.keys(scoreBreakdown).slice(0, 4);
  const visibleNotes  = notesExpanded ? notes : notes.slice(0, 3);

  const handlePDF = async () => {
    if (!resumeData) return;
    setLoadingBtn('pdf');
    try { await downloadResumePDF(resumeData, company, jobTitle); }
    finally { setLoadingBtn(null); }
  };

  const handleDocx = async () => {
    setLoadingBtn('docx');
    try {
      const blob = resumeData
        ? await generateResumeDocx(resumeData, company, jobTitle)
        : new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = `tailored_resume_${Date.now()}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally { setLoadingBtn(null); }
  };

  return (
    <div className="mt-3 rounded-xl border bg-muted/30 p-3 space-y-3">
      {/* ATS score bar */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-foreground">
          ATS Score: <span className={scoreColor}>{ats}%</span>
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${scoreBg}`} style={{ width: `${ats}%` }} />
        </div>
      </div>

      {/* Score breakdown */}
      {breakdownKeys.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/30">
          {breakdownKeys.map((key) => {
            const val = Math.min(100, Math.max(0, scoreBreakdown[key] ?? 0));
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const barColor = val >= 70 ? 'bg-green-400' : val >= 45 ? 'bg-amber-400' : 'bg-red-400';
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0 capitalize">{label}</span>
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${val}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-7 text-right">{val}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Optimization notes */}
      {notes.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Key improvements</p>
          <ul className="space-y-0.5">
            {visibleNotes.map((n, i) => (
              <li key={i} className="text-[11px] text-foreground/80 flex gap-1.5">
                <span className="text-primary shrink-0">·</span>{n}
              </li>
            ))}
          </ul>
          {notes.length > 3 && (
            <button
              onClick={() => setNotesExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary mt-1"
            >
              {notesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {notesExpanded ? 'Show less' : `+${notes.length - 3} more improvements`}
            </button>
          )}
        </div>
      )}

      {/* Download buttons */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-border/30">
        <button
          onClick={handlePDF}
          disabled={loadingBtn !== null}
          className="flex items-center gap-1.5 h-7 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 px-3 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {loadingBtn === 'pdf' ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
          {loadingBtn === 'pdf' ? 'Generating…' : 'Download PDF'}
        </button>
        <button
          onClick={handleDocx}
          disabled={loadingBtn !== null}
          className="flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {loadingBtn === 'docx' ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
          {loadingBtn === 'docx' ? 'Generating…' : 'Download DOCX'}
        </button>
        {text && (
          <button
            onClick={() => exportToCSV([{ resume: text }], `tailored_resume_${Date.now()}.txt`)}
            className="flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3 w-3" />
            TXT
          </button>
        )}
      </div>
    </div>
  );
}

function FreelancersActionCard({ data }: { data: any }) {
  const freelancers: any[] = data?.freelancers ?? [];
  if (!freelancers.length) return null;
  return (
    <div className="mt-2 space-y-0">
      {freelancers.map((f: any, i: number) => (
        <FreelancerCard key={f.user_id || i} freelancer={f} index={i} />
      ))}
    </div>
  );
}

// ── Suggestion chips ─────────────────────────────────────────────────────────

function SuggestionChips({ chips, onSend }: { chips: string[]; onSend?: (msg: string) => void }) {
  if (!onSend) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/20">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSend(chip)}
          className="rounded-full border border-border/50 bg-background dark:bg-muted/30 px-3 py-1 text-xs font-medium text-foreground/80 hover:bg-muted hover:border-primary/30 transition-colors"
        >
          ↳ {chip}
        </button>
      ))}
    </div>
  );
}

// ── Main bubble ──────────────────────────────────────────────────────────────

export function MessageBubble({ message, onSendMessage }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Special resume context card
  if ((message as any)._type === 'resume_context') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex gap-3 mb-4"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm mt-0.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[11px] font-semibold text-foreground/60 mb-1">Nova</p>
          <ResumeContextCard />
        </div>
      </motion.div>
    );
  }

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex justify-end mb-3"
      >
        <div className="max-w-[75%]">
          <div className="bg-[#F4C6A0] text-gray-900 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1 text-right pr-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex gap-3 mb-5"
    >
      {/* Nova avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm mt-0.5">
        <Sparkles className="h-4 w-4 text-white" />
      </div>

      {/* Nova message */}
      <div className="flex-1 min-w-0 pt-0.5 max-w-[85%]">
        <p className="text-[11px] font-semibold text-foreground/60 mb-1">Nova</p>

        <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-card shadow-sm border border-border/40 px-4 py-3">
          <div
            className={cn(
              'text-sm leading-relaxed text-foreground',
              '[&_p]:mb-3 [&_p]:last:mb-0',
              '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
              '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
              '[&_li]:leading-relaxed',
              '[&_strong]:font-semibold [&_strong]:text-foreground',
              '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-1',
              '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1',
              '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-1',
              '[&_code]:bg-muted [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
              '[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:mb-3 [&_pre]:overflow-x-auto',
              '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground',
              '[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
              '[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_table]:my-2',
              '[&_th]:border [&_th]:border-border/50 [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted-foreground',
              '[&_td]:border [&_td]:border-border/40 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top',
              '[&_tr]:hover:[&_td]:bg-muted/20',
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {/* Action cards */}
          {message.action_type === 'jobs_results' && (
            <>
              <JobsActionCard data={message.action_data} onSendMessage={onSendMessage} />
              <SuggestionChips onSend={onSendMessage} chips={[
                'Tailor my resume for the top job',
                'Evaluate this job',
                'Find more jobs like these',
                'Research the company',
              ]} />
            </>
          )}
          {message.action_type === 'leads_results' && (
            <>
              <LeadsActionCard data={message.action_data} onSendMessage={onSendMessage} />
              <SuggestionChips onSend={onSendMessage} chips={[
                'Find more leads in another city',
                'Which lead is the best prospect?',
                'Find a different category of leads',
                'Export these leads',
              ]} />
            </>
          )}
          {message.action_type === 'tailored_resume' && (
            <TailoredResumeCard data={message.action_data} />
          )}
          {message.action_type === 'freelancers_results' && (
            <>
              <FreelancersActionCard data={message.action_data} />
              <SuggestionChips onSend={onSendMessage} chips={[
                'Find freelancers with a different skill',
                'Which freelancer is the best fit?',
              ]} />
            </>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/70 mt-1 pl-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
