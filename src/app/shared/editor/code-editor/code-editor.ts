import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  afterRenderEffect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { EditorHandle } from '../cm-setup';
import type { EditorLang } from '../editor-lang';

/**
 * Loads the CodeMirror module. The default factory is the dynamic `import()`
 * that keeps CodeMirror out of the initial bundle (see the class doc below);
 * overriding it is how a test simulates a chunk that fails to load, or
 * mounts a fake editor, without needing a real network fetch or a real
 * `EditorView` — the same seam {@link WORKER_FACTORY} gives `CodeRunner` over
 * `Worker`, for the same reason.
 */
export const CM_MODULE = new InjectionToken<() => Promise<typeof import('../cm-setup')>>(
  'CM_MODULE',
  { providedIn: 'root', factory: () => () => import('../cm-setup') },
);

/**
 * A code editor: CodeMirror 6, loaded on demand, behind a plain `<textarea>`.
 *
 * ## Why it is built this way
 *
 * The app advertises no third-party UI libraries and a hand-rolled highlighter,
 * and that stance held until the author asked for a real editor in the page
 * (`docs/BACKLOG.md` §2.5). CodeMirror is the one exception, chosen over Monaco
 * (2 MB, needs a worker) and WebContainers (cross-origin isolation on every
 * host). Even so it must not cost the reader who never opens it anything, so:
 *
 * 1. **It renders a `<textarea>` first.** That is a working editor with no
 *    JavaScript at all — labelled, keyboard-accessible, and enough to type in.
 * 2. **CodeMirror arrives after first render**, through a dynamic `import()` of
 *    `cm-setup.ts`, and replaces the textarea in place. The reader sees the
 *    upgrade as a flicker at most.
 * 3. **If CodeMirror cannot mount** — an old browser, a test runner without a
 *    layout engine, a blocked chunk — the textarea simply stays. Nothing about
 *    the page depends on the upgrade having happened.
 *
 * The component owns the text: it emits {@link codeChange} on every edit and
 * accepts a new {@link code} input to replace the document (that is how a
 * "Reset" button works). It never echoes a value it just emitted back into the
 * editor, which would otherwise reset the cursor on every keystroke.
 *
 * ## Usage
 *
 * ```html
 * <app-code-editor [code]="draft()" lang="ts" label="Your solution" (codeChange)="draft.set($event)" />
 * ```
 *
 * ## Accessibility
 *
 * Both the textarea and CodeMirror's content area carry {@link label} as their
 * accessible name. CodeMirror's `Tab` is left unbound so the editor is never a
 * keyboard trap; see `cm-setup.ts`.
 */
@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditor {
  /** The text to show. Changing it replaces the document — use it for reset, not for echoing edits. */
  readonly code = input.required<string>();

  /** Which grammar to load. */
  readonly lang = input<EditorLang>('ts');

  /** Read-only editors still get syntax colouring, selection and search. */
  readonly readonly = input(false);

  /** Accessible name. Say what the code *is* — "Starter code for Task 3", not "Editor". */
  readonly label = input('Code editor');

  /** Minimum visible height, in lines, so an empty editor is still an obvious target. */
  readonly minLines = input(6);

  /** The full text after every user edit. */
  readonly codeChange = output<string>();

  /** True once CodeMirror has replaced the textarea. */
  protected readonly ready = signal(false);

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly fallback = viewChild<ElementRef<HTMLTextAreaElement>>('fallback');
  private readonly loadCm = inject(CM_MODULE);
  private handle: EditorHandle | null = null;
  private destroyed = false;

  /**
   * The text the editor currently holds, as far as we know. Compared against
   * the `code` input so a value we just emitted is not pushed straight back in.
   */
  private current = '';

  constructor() {
    afterNextRender(() => {
      void this.mount();
    });

    // A new `code` from the parent (reset, a different sample) replaces the document.
    afterRenderEffect(() => {
      const code = this.code();
      untracked(() => this.push(code));
    });
    afterRenderEffect(() => {
      const lang = this.lang();
      untracked(() => this.handle?.setLang(lang));
    });
    afterRenderEffect(() => {
      const readonly = this.readonly();
      untracked(() => this.handle?.setReadonly(readonly));
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.handle?.destroy();
      this.handle = null;
    });
  }

  /** Moves keyboard focus into whichever editor is live. */
  focus(): void {
    if (this.handle) this.handle.focus();
    else this.fallback()?.nativeElement.focus();
  }

  private async mount(): Promise<void> {
    let createEditor: typeof import('../cm-setup').createEditor;
    try {
      ({ createEditor } = await this.loadCm());
    } catch {
      return; // chunk failed to load — the textarea is the editor
    }
    if (this.destroyed) return;

    try {
      this.current = this.code();
      this.handle = createEditor(this.host().nativeElement, {
        doc: this.current,
        lang: this.lang(),
        readonly: this.readonly(),
        label: this.label(),
        onChange: (doc) => {
          this.current = doc;
          this.codeChange.emit(doc);
        },
      });
      this.ready.set(true);
    } catch {
      this.handle?.destroy();
      this.handle = null; // could not mount — the textarea is the editor
    }
  }

  private push(code: string): void {
    if (code === this.current) return;
    this.current = code;
    this.handle?.setDoc(code);
  }

  protected onFallbackInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.current = value;
    this.codeChange.emit(value);
  }
}
