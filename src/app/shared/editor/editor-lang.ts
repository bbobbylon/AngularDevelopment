import type { HighlightLang } from '../highlighter';

/**
 * The languages the in-page editor can open. Anything else — shell transcripts,
 * SQL, YAML, Java, program output — stays a static highlighted block, because
 * editing it would promise something the page cannot deliver.
 */
export type EditorLang = 'ts' | 'js' | 'html' | 'css' | 'json';

/** Maps a highlighter language onto an editor language, or `null` if the block is not editable. */
export function toEditorLang(lang: HighlightLang | EditorLang): EditorLang | null {
  switch (lang) {
    case 'ts':
    case 'js':
    case 'html':
    case 'css':
    case 'json':
      return lang;
    default:
      return null;
  }
}

/**
 * Only plain TypeScript and JavaScript can *run*: the sandbox is a Web Worker
 * with the types stripped, not a compiler. Markup is previewed instead.
 */
export function isRunnable(lang: EditorLang): boolean {
  return lang === 'ts' || lang === 'js';
}

/** An HTML file can be rendered into a sandboxed frame, with any CSS file alongside it. */
export function isPreviewable(lang: EditorLang): boolean {
  return lang === 'html';
}
