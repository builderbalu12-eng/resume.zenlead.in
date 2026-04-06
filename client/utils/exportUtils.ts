/** Trigger a browser download safely: appends to DOM, clicks, then cleans up after a delay. */
function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Revoke after a short delay so the browser has time to start the download
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
}

/** Download an array of objects as a CSV file — no library required. */
export function exportToCSV(rows: Record<string, any>[], filename: string): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
}

/** Download a plain-text string as a .docx file using the `docx` package. */
export async function exportToDocx(text: string, filename: string): Promise<void> {
  const { Document, Paragraph, TextRun, Packer, HeadingLevel } = await import('docx');

  const children = text.split('\n').map((line) => {
    const trimmed = line.trim();

    // Detect markdown headings
    if (trimmed.startsWith('## ')) {
      return new Paragraph({
        text: trimmed.slice(3),
        heading: HeadingLevel.HEADING_2,
      });
    }
    if (trimmed.startsWith('# ')) {
      return new Paragraph({
        text: trimmed.slice(2),
        heading: HeadingLevel.HEADING_1,
      });
    }
    // Detect bullet lines
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return new Paragraph({
        children: [new TextRun(trimmed.slice(2))],
        bullet: { level: 0 },
      });
    }
    return new Paragraph({ children: [new TextRun(line)] });
  });

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
}
