/** Triggers a browser download of `content` as a file named `filename`. No-ops outside the browser (SSR). */
export function downloadTextFile(filename: string, content: string, mime = 'text/markdown'): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
