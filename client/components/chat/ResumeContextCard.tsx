import { FileText } from 'lucide-react';

export function ResumeContextCard() {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-xl border border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/20 px-3.5 py-2.5">
      <FileText className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
      <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
        i've loaded your resume — i'll use it to personalise job matches and tailor applications for you.
      </p>
    </div>
  );
}
