import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Download, FileSpreadsheet, FileText, TrendingUp, ExternalLink } from 'lucide-react';
import { exportToCSV, exportToDocx } from '@/utils/exportUtils';
import { JobRecommendationCard } from './JobRecommendationCard';
import { ResumeContextCard } from './ResumeContextCard';
import { FreelancerCard } from './FreelancerCard';

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

function LeadsActionCard({ data }: { data: any }) {
  const leads: Record<string, any>[] = data?.leads ?? [];
  if (!leads.length) return null;

  const city = data?.city ? ` · ${data.city}` : '';
  const cat = data?.category ? ` · ${data.category}` : '';
  const columns = ['Name', 'Phone', 'Address', 'Has Website', 'Rating'];
  const tableRows = leads.map((l) => ({
    Name: l.Name ?? l.name ?? '',
    Phone: l.Phone ?? l.phone ?? '',
    Address: l.Address ?? l.address ?? '',
    'Has Website': l['Has Website'] ?? (l.has_website ? 'Yes' : 'No'),
    Rating: l.Rating ?? l.rating ?? '',
  }));

  return (
    <div className="mt-3 rounded-xl border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
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
      <InlineTable columns={columns} rows={tableRows} />
    </div>
  );
}

function TailoredResumeCard({ data }: { data: any }) {
  const text: string = data?.tailored_resume ?? '';
  const ats: number = data?.ats_score ?? 0;
  const [loading, setLoading] = useState(false);

  if (!text) return null;

  const scoreColor =
    ats >= 80
      ? 'text-green-600 dark:text-green-400'
      : ats >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const handleDocx = async () => {
    setLoading(true);
    try {
      await exportToDocx(text, `tailored_resume_${Date.now()}.docx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-foreground">
          ATS Score: <span className={scoreColor}>{ats}%</span>
        </span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${ats >= 80 ? 'bg-green-500' : ats >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${ats}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDocx}
          disabled={loading}
          className="flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <FileText className="h-3 w-3" />
          {loading ? 'Generating…' : 'Download DOCX'}
        </button>
        <button
          onClick={() => exportToCSV([{ resume: text }], `tailored_resume_${Date.now()}.txt`)}
          className="flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Download className="h-3 w-3" />
          Download as TXT
        </button>
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
            <JobsActionCard data={message.action_data} onSendMessage={onSendMessage} />
          )}
          {message.action_type === 'leads_results' && (
            <LeadsActionCard data={message.action_data} />
          )}
          {message.action_type === 'tailored_resume' && (
            <TailoredResumeCard data={message.action_data} />
          )}
          {message.action_type === 'freelancers_results' && (
            <FreelancersActionCard data={message.action_data} />
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
