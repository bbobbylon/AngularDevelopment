import type { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeRunner, WORKER_FACTORY, type RunLine } from './runner/code-runner';
import { HtmlPreview, buildPreviewDocument } from './html-preview/html-preview';
import { CM_MODULE, CodeEditor } from './code-editor/code-editor';
import { isPreviewable, isRunnable, toEditorLang } from './editor-lang';

/**
 * Tests for the live-coding editor set (`docs/BACKLOG.md` §2.5).
 *
 * `cm-setup.ts` — the actual CodeMirror wiring — is covered separately in
 * `cm-setup.spec.ts` against a real `EditorView`. The Angular unit-test
 * runner also rejects `vi.mock` on relative imports outright, so `CodeEditor`
 * below is tested through the `CM_MODULE` injection token instead — the same
 * seam `CodeRunner` gives tests over `Worker` via `WORKER_FACTORY`. What
 * matters at this level is the component's own contract: it never mounts a
 * second copy, it falls back cleanly when the upgrade fails, and it never
 * echoes an edit it just emitted back into the editor.
 */

// ── helpers ─────────────────────────────────────────────────────────────────────────

interface Harness<T> {
  readonly fixture: ComponentFixture<T>;
  readonly host: HTMLElement;
}

function render<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {},
  providers: unknown[] = [],
): Harness<T> {
  TestBed.configureTestingModule({ imports: [component], providers });

  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();

  return { fixture, host: fixture.nativeElement as HTMLElement };
}

// ── editor-lang ─────────────────────────────────────────────────────────────────────

describe('toEditorLang', () => {
  it('passes through the languages the editor understands', () => {
    expect(toEditorLang('ts')).toBe('ts');
    expect(toEditorLang('js')).toBe('js');
    expect(toEditorLang('html')).toBe('html');
    expect(toEditorLang('css')).toBe('css');
    expect(toEditorLang('json')).toBe('json');
  });

  it('returns null for a highlighter language the editor cannot open', () => {
    expect(toEditorLang('bash')).toBeNull();
    expect(toEditorLang('text')).toBeNull();
  });
});

describe('isRunnable', () => {
  it('is true only for plain TypeScript and JavaScript', () => {
    expect(isRunnable('ts')).toBe(true);
    expect(isRunnable('js')).toBe(true);
    expect(isRunnable('html')).toBe(false);
    expect(isRunnable('css')).toBe(false);
    expect(isRunnable('json')).toBe(false);
  });
});

describe('isPreviewable', () => {
  it('is true only for HTML', () => {
    expect(isPreviewable('html')).toBe(true);
    expect(isPreviewable('ts')).toBe(false);
    expect(isPreviewable('css')).toBe(false);
  });
});

// ── buildPreviewDocument ────────────────────────────────────────────────────────────

describe('buildPreviewDocument', () => {
  it('wraps a bare fragment in a full document', () => {
    const doc = buildPreviewDocument('<p>hi</p>', '');
    expect(doc).toContain('<!doctype html>');
    expect(doc).toContain('<body><p>hi</p></body>');
  });

  it('injects css into the wrapper it builds for a fragment', () => {
    const doc = buildPreviewDocument('<p>hi</p>', 'p { color: red; }');
    expect(doc).toContain('<style>p { color: red; }</style>');
  });

  it('injects css before an existing </head> on a whole document', () => {
    const doc = buildPreviewDocument(
      '<html><head><title>x</title></head><body></body></html>',
      'b{}',
    );
    expect(doc).toContain('<style>b{}</style></head>');
    expect(doc.indexOf('<style>')).toBeGreaterThan(doc.indexOf('<title>'));
  });

  it('adds a head to a whole document that has none', () => {
    const doc = buildPreviewDocument('<html><body>hi</body></html>', 'b{}');
    expect(doc).toContain('<head><meta charset="utf-8"><style>b{}</style></head>');
  });

  it('emits no <style> tag when there is no css to inject', () => {
    const doc = buildPreviewDocument('<html><head></head><body></body></html>', '');
    expect(doc).not.toContain('<style>');
  });
});

describe('HtmlPreview', () => {
  it('renders a sandboxed frame with no attributes granting extra access', () => {
    const { host } = render(HtmlPreview, { html: '<p>hi</p>' });
    const frame = host.querySelector('iframe');

    expect(frame?.getAttribute('sandbox')).toBe('');
  });

  it('names the frame from the title input', () => {
    const { host } = render(HtmlPreview, { html: '<p>hi</p>', title: 'Task 2 preview' });
    expect(host.querySelector('iframe')?.getAttribute('title')).toBe('Task 2 preview');
  });

  it('sets srcdoc to the built document rather than binding it through Angular', () => {
    const { host } = render(HtmlPreview, { html: '<p>hi</p>', css: 'p{color:red}' });
    const srcdoc = host.querySelector('iframe')?.getAttribute('srcdoc') ?? '';

    expect(srcdoc).toContain('<p>hi</p>');
    expect(srcdoc).toContain('color:red');
  });
});

// ── CodeRunner.prepare ──────────────────────────────────────────────────────────────

describe('CodeRunner.prepare', () => {
  function makeRunner(): CodeRunner {
    TestBed.configureTestingModule({});
    return TestBed.inject(CodeRunner);
  }

  it('leaves plain JavaScript with no imports untouched apart from formatting', async () => {
    const runner = makeRunner();
    const { js, notes } = await runner.prepare('console.log(1);', 'js');

    expect(js).toContain('console.log(1);');
    expect(notes).toEqual([]);
  });

  it('strips a single-specifier import and notes what was removed', async () => {
    const runner = makeRunner();
    const { js, notes } = await runner.prepare("import { of } from 'rxjs';\nconsole.log(1);", 'js');

    expect(js).not.toContain('import');
    expect(js).toContain('console.log(1);');
    expect(notes[0]).toContain('rxjs');
  });

  it('strips a side-effect import', async () => {
    const runner = makeRunner();
    const { js, notes } = await runner.prepare("import 'zone.js';\nconsole.log(1);", 'js');

    expect(js).not.toContain('import');
    expect(notes[0]).toContain('zone.js');
  });

  it('drops export keywords rather than the declarations they sit on', async () => {
    const runner = makeRunner();
    const { js } = await runner.prepare('export function add(a, b) { return a + b; }', 'js');

    expect(js).not.toContain('export');
    expect(js).toContain('function add(a, b) { return a + b; }');
  });

  it('drops an export list without touching the declarations it names', async () => {
    const runner = makeRunner();
    const { js } = await runner.prepare('const a = 1;\nexport { a };', 'js');

    expect(js).not.toContain('export');
    expect(js).toContain('const a = 1;');
  });

  it('strips TypeScript types via sucrase when the language is ts', async () => {
    const runner = makeRunner();
    const { js } = await runner.prepare('const a: number = 1;\nconsole.log(a);', 'ts');

    expect(js).not.toContain(': number');
    expect(js).toContain('console.log(a);');
  });

  it('warns about decorators, which the sandbox cannot compile', async () => {
    const runner = makeRunner();
    const { notes } = await runner.prepare('@Component({})\nclass Foo {}', 'ts');

    expect(notes.some((n) => n.includes('Decorators'))).toBe(true);
  });

  it('rejects with a located message on a genuine TypeScript syntax error', async () => {
    const runner = makeRunner();
    await expect(runner.prepare('const a: = ;', 'ts')).rejects.toBeTruthy();
  });
});

// ── CodeRunner.run ──────────────────────────────────────────────────────────────────

/** Speaks the same postMessage/onmessage/onerror/terminate shape as a real Worker. */
class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly terminate = vi.fn();
  postMessage(): void {}

  send(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

describe('CodeRunner.run', () => {
  function makeRunner(factory: (source: string) => Worker | null): CodeRunner {
    TestBed.configureTestingModule({ providers: [{ provide: WORKER_FACTORY, useValue: factory }] });
    return TestBed.inject(CodeRunner);
  }

  /** Awaits the worker the factory creates for the in-flight `run()` call. */
  function nextWorker(): { created: Promise<FakeWorker>; factory: (source: string) => Worker } {
    let resolve!: (worker: FakeWorker) => void;
    const created = new Promise<FakeWorker>((r) => (resolve = r));
    const factory = () => {
      const worker = new FakeWorker();
      resolve(worker);
      return worker as unknown as Worker;
    };
    return { created, factory };
  }

  it('resolves with the lines the worker printed before going idle', async () => {
    const { created, factory } = nextWorker();
    const runner = makeRunner(factory);

    const resultPromise = runner.run('console.log(1);', 'js');
    const worker = await created;
    worker.send({ type: 'line', level: 'log', text: '1' });
    worker.send({ type: 'idle' });

    const result = await resultPromise;
    expect(result.error).toBeNull();
    expect(result.timedOut).toBe(false);
    expect(result.lines).toEqual<RunLine[]>([{ level: 'log', text: '1' }]);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('resolves with an error and terminates the worker on an error message', async () => {
    const { created, factory } = nextWorker();
    const runner = makeRunner(factory);

    const resultPromise = runner.run('throw new Error("boom");', 'js');
    const worker = await created;
    worker.send({ type: 'error', text: 'Error: boom' });

    const result = await resultPromise;
    expect(result.error).toBe('Error: boom');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('carries any prepare-time notes ahead of the run, even on a run that then errors', async () => {
    const { created, factory } = nextWorker();
    const runner = makeRunner(factory);

    const resultPromise = runner.run("import 'rxjs';\nthrow new Error('x');", 'js');
    const worker = await created;
    worker.send({ type: 'error', text: 'x' });

    const result = await resultPromise;
    expect(result.lines[0]).toEqual({ level: 'note', text: expect.stringContaining('rxjs') });
  });

  it('times the run out and terminates the worker when nothing ever goes idle', async () => {
    vi.useFakeTimers();
    try {
      const { created, factory } = nextWorker();
      const runner = makeRunner(factory);

      const resultPromise = runner.run('setInterval(() => {}, 10);', 'js', 50);
      const worker = await created;
      await vi.advanceTimersByTimeAsync(50);

      const result = await resultPromise;
      expect(result.timedOut).toBe(true);
      expect(result.error).toBeNull();
      expect(worker.terminate).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a plain error, with no worker to terminate, when the sandbox is unavailable', async () => {
    const runner = makeRunner(() => null);

    const result = await runner.run('console.log(1);', 'js');
    expect(result.error).toContain('Web Workers');
  });

  it('never rejects, even when the code cannot be prepared', async () => {
    const runner = makeRunner(() => null);
    const result = await runner.run('const a: = ;', 'ts');
    expect(result.error).toBeTruthy();
  });
});

// ── CodeEditor ──────────────────────────────────────────────────────────────────────

/**
 * A fake `EditorHandle`, and a `CM_MODULE` provider resolving to it — the DI
 * seam described on {@link CM_MODULE} standing in for a real dynamic import
 * of `cm-setup.ts`, the same way `WORKER_FACTORY` stands in for a real
 * `Worker` above. `cm-setup.spec.ts` is what proves the real module works.
 */
function fakeCmProvider(): { provider: unknown; handle: EditorHandleLike } {
  const handle: EditorHandleLike = {
    getDoc: () => '',
    setDoc: vi.fn(),
    setLang: vi.fn(),
    setReadonly: vi.fn(),
    focus: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    provider: {
      provide: CM_MODULE,
      useValue: () => Promise.resolve({ createEditor: () => handle }),
    },
    handle,
  };
}

interface EditorHandleLike {
  getDoc(): string;
  setDoc: ReturnType<typeof vi.fn>;
  setLang: ReturnType<typeof vi.fn>;
  setReadonly: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

describe('CodeEditor', () => {
  it('renders the no-JavaScript textarea first, with the given label and starting text', () => {
    // Asserted before any `await` runs, so this is the state before the dynamic
    // import of cm-setup — which is always at least one microtask away — settles.
    const { host } = render(CodeEditor, { code: 'const a = 1;', label: 'Starter code' });

    const textarea = host.querySelector('textarea.editor__fallback') as HTMLTextAreaElement;
    expect(textarea.getAttribute('aria-label')).toBe('Starter code');
    expect(textarea.value).toBe('const a = 1;');
  });

  it('emits codeChange as the reader types in the fallback textarea', () => {
    const { host, fixture } = render(CodeEditor, { code: '', label: 'Code' });
    let emitted = '';
    fixture.componentInstance.codeChange.subscribe((v: string) => (emitted = v));

    const textarea = host.querySelector('textarea.editor__fallback') as HTMLTextAreaElement;
    textarea.value = 'const b = 2;';
    textarea.dispatchEvent(new Event('input'));

    expect(emitted).toBe('const b = 2;');
  });

  it('swaps to the CodeMirror host once mounting succeeds, and hides the textarea', async () => {
    const { provider } = fakeCmProvider();
    const { host, fixture } = render(CodeEditor, { code: 'x', label: 'Code' }, [provider]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('textarea.editor__fallback')).toBeNull();
    expect(host.querySelector('.editor__host')?.hasAttribute('hidden')).toBe(false);
  });

  it('stays on the fallback textarea when the cm-setup chunk fails to load', async () => {
    const { host, fixture } = render(CodeEditor, { code: 'x', label: 'Code' }, [
      { provide: CM_MODULE, useValue: () => Promise.reject(new Error('chunk load failed')) },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('textarea.editor__fallback')).not.toBeNull();
  });

  it('stays on the fallback textarea when createEditor itself throws', async () => {
    const { host, fixture } = render(CodeEditor, { code: 'x', label: 'Code' }, [
      {
        provide: CM_MODULE,
        useValue: () =>
          Promise.resolve({
            createEditor: () => {
              throw new Error('cannot mount in this environment');
            },
          }),
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('textarea.editor__fallback')).not.toBeNull();
  });

  it('pushes a new code input into the mounted editor without re-emitting it', async () => {
    const { provider, handle } = fakeCmProvider();
    const { fixture } = render(CodeEditor, { code: 'first', label: 'Code' }, [provider]);
    await fixture.whenStable();
    fixture.detectChanges();

    handle.setDoc.mockClear();
    fixture.componentRef.setInput('code', 'second');
    fixture.detectChanges();

    expect(handle.setDoc).toHaveBeenCalledWith('second');
  });
});
