import { Injectable, InjectionToken, inject } from '@angular/core';
import { HARNESS, HARNESS_PREFIX_LINES } from './harness';

/** One line of output from a run. `note` is the harness talking, not the program. */
export interface RunLine {
  readonly level: 'log' | 'info' | 'warn' | 'error' | 'note';
  readonly text: string;
}

/** Everything a run produced. `error` is the message that ended it early, if one did. */
export interface RunResult {
  readonly lines: RunLine[];
  readonly error: string | null;
  /** True when the page's timeout ended the run — an interval, an infinite loop, or just slow. */
  readonly timedOut: boolean;
  readonly ms: number;
}

/** The user's code after preparation: plain JavaScript plus anything worth telling them about. */
export interface PreparedCode {
  readonly js: string;
  readonly notes: string[];
}

/** Message shapes posted by the worker harness. */
type HarnessMessage =
  | { type: 'line'; level: RunLine['level']; text: string }
  | { type: 'error'; text: string }
  | { type: 'idle' };

/**
 * Builds the worker a run executes in. Injectable so a test can substitute a
 * fake that speaks the same message protocol without needing `Worker` or
 * `URL.createObjectURL`, neither of which a jsdom test has.
 */
export const WORKER_FACTORY = new InjectionToken<(source: string) => Worker | null>(
  'WORKER_FACTORY',
  { providedIn: 'root', factory: () => createBlobWorker },
);

/** A worker from a Blob URL — the page's CSP allows `worker-src blob:` for exactly this. */
function createBlobWorker(source: string): Worker | null {
  if (typeof Worker === 'undefined' || typeof URL?.createObjectURL !== 'function') return null;
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    return new Worker(url);
  } finally {
    // The constructor has resolved the URL by the time it returns, but revoking on
    // the same tick has been seen to race the fetch in some engines. A second later
    // is safe and the worker is long since running (or long since dead).
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Runs a reader's TypeScript or JavaScript in a sandboxed Web Worker and
 * returns what it printed.
 *
 * ## What it is, and is not
 *
 * It is a *scratch runner*: strip the types, run the JavaScript, capture the
 * console. It is not a compiler and not Angular. A snippet that imports from
 * `@angular/core` will run up to the first use of `signal()` and then throw a
 * `ReferenceError`, which is the honest outcome — and the runner says so in a
 * note before the run starts, so the reader is not left wondering. Foundation
 * lessons (values, functions, arrays, loops, async) and most TypeScript lessons
 * run as written.
 *
 * ## Preparation
 *
 * 1. **Types are stripped with sucrase** (`transforms: ['typescript']`), which
 *    also elides imports that were only used as types. It is loaded on demand,
 *    so a reader who never presses Run never downloads it.
 * 2. **Remaining `import`s are removed** and listed in the notes. A classic
 *    worker cannot import modules, and the sandbox has no `node_modules`.
 * 3. **`export` keywords are dropped** from declarations so the code is a
 *    valid script body. `export { … }` lists are removed.
 * 4. The result is spliced into {@link HARNESS}, which supplies `console`,
 *    timer tracking and error capture.
 *
 * ## Ending a run
 *
 * The worker posts `idle` when the main body has finished *and* no timer is
 * pending, `error` when something threw, and the page terminates it on either.
 * Anything still running at `timeoutMs` — an interval, an infinite loop — is
 * terminated from outside; a worker can always be killed, which is the reason
 * a worker was chosen over an iframe.
 */
@Injectable({ providedIn: 'root' })
export class CodeRunner {
  private readonly makeWorker = inject(WORKER_FACTORY);

  /**
   * Turns the reader's code into something the harness can execute. Pure apart
   * from the lazy sucrase import; unit-tested on its own.
   */
  async prepare(code: string, lang: 'ts' | 'js'): Promise<PreparedCode> {
    const notes: string[] = [];
    let js = code;

    if (lang === 'ts') {
      const { transform } = await import('sucrase');
      js = transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
    }

    const removed: string[] = [];
    js = js
      // import x from 'y'; import { a, b } from 'y'; import * as z from 'y'; — including multi-line lists.
      .replace(
        /^[ \t]*import\s+(?!type\b)[^;'"]*?\s+from\s+(['"])([^'"]+)\1\s*;?[ \t]*$/gm,
        (_m, _q, spec: string) => {
          removed.push(spec);
          return '';
        },
      )
      // import 'y'; — side-effect imports.
      .replace(/^[ \t]*import\s+(['"])([^'"]+)\1\s*;?[ \t]*$/gm, (_m, _q, spec: string) => {
        removed.push(spec);
        return '';
      })
      .replace(/^([ \t]*)export\s+default\s+/gm, '$1')
      .replace(
        /^([ \t]*)export\s+(?=(?:const|let|var|function|async|class|abstract|enum)\b)/gm,
        '$1',
      )
      .replace(/^[ \t]*export\s*\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?\s*;?[ \t]*$/gm, '');

    if (removed.length) {
      const list = [...new Set(removed)].map((s) => `'${s}'`).join(', ');
      notes.push(
        `Imports are not available in the sandbox — removed ${list}. Anything the code uses from there will be undefined.`,
      );
    }
    if (/^[ \t]*@\w+\s*\(/m.test(js)) {
      notes.push(
        'Decorators like @Component need the Angular compiler. The sandbox runs plain TypeScript, so this will stop at the first decorator.',
      );
    }

    return { js, notes };
  }

  /** Runs the code and resolves with everything it printed. Never rejects. */
  async run(code: string, lang: 'ts' | 'js', timeoutMs = 3000): Promise<RunResult> {
    const started = Date.now();
    const lines: RunLine[] = [];

    let prepared: PreparedCode;
    try {
      prepared = await this.prepare(code, lang);
    } catch (error) {
      return {
        lines,
        error: describeSyntaxError(error),
        timedOut: false,
        ms: Date.now() - started,
      };
    }
    for (const note of prepared.notes) lines.push({ level: 'note', text: note });

    const worker = this.makeWorker(HARNESS.replace('/*__USER_CODE__*/', prepared.js));
    if (!worker) {
      return {
        lines,
        error: 'Running code needs a browser with Web Workers.',
        timedOut: false,
        ms: Date.now() - started,
      };
    }

    return new Promise<RunResult>((resolve) => {
      let settled = false;
      const finish = (error: string | null, timedOut = false): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve({ lines, error, timedOut, ms: Date.now() - started });
      };
      const timer = setTimeout(() => finish(null, true), timeoutMs);

      worker.onmessage = (event: MessageEvent<HarnessMessage>) => {
        const message = event.data;
        if (message.type === 'line') lines.push({ level: message.level, text: message.text });
        else if (message.type === 'error') finish(relocate(message.text));
        else if (message.type === 'idle') finish(null);
      };
      // A parse error in the user's code fails the whole script, which surfaces here.
      worker.onerror = (event: ErrorEvent) => {
        event.preventDefault?.();
        const line = event.lineno ? ` (line ${event.lineno - HARNESS_PREFIX_LINES})` : '';
        finish(`${event.message}${line}`);
      };
    });
  }
}

/** Stack traces point into the blob; move their line numbers back into the reader's code. */
function relocate(text: string): string {
  return text.replace(
    /\(?blob:[^\s)]+:(\d+):(\d+)\)?/g,
    (_m, line: string, col: string) => `(line ${Number(line) - HARNESS_PREFIX_LINES}:${col})`,
  );
}

/** sucrase throws a plain Error with `loc`; say where, not just what. */
function describeSyntaxError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; loc?: { line?: number; column?: number } };
    const where = e.loc?.line
      ? ` (line ${e.loc.line}${e.loc.column ? `:${e.loc.column}` : ''})`
      : '';
    return `${e.message ?? String(error)}${where}`;
  }
  return String(error);
}
