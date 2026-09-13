import { Directive, ElementRef, effect, inject, input } from '@angular/core';

import { highlight, type HighlightLang } from './highlighter';

/**
 * Syntax-highlights a `<pre>` whose contents can change, by owning the element's
 * `innerHTML` instead of letting a template interpolation write into it.
 *
 * ## Why this exists
 *
 * The app-wide sweep in `app.ts` highlights `.code pre` once per navigation by
 * assigning `innerHTML`. That works for a static sample and fails in two ways
 * for anything else:
 *
 * 1. **It clobbers a live binding.** `<pre>{{ sanitized() }}</pre>` renders as a
 *    text node that Angular keeps a reference to. Assigning `innerHTML` removes
 *    that node; the binding survives and keeps writing to it, but it is no
 *    longer in the document, so the block freezes at whatever it said when the
 *    sweep ran. Two demos shipped in this state — the security lesson's
 *    sanitizer output and the `+` operator playground in programming-basics —
 *    because both are `computed`s that start non-empty. The ones that start
 *    empty were spared only by the sweep's `if (!text.trim()) return`, which is
 *    luck rather than design. This is why the sweep skips `.demo` entirely, and
 *    why everything inside a demo has been rendering as flat text.
 * 2. **It only runs on navigation.** Code revealed later — inside an accordion,
 *    behind a `@defer`, or appended by a demo — is never tokenised, because the
 *    sweep has already been and gone.
 *
 * A directive has neither problem. It owns the element, so there is no
 * competing binding to clobber, and its {@link effect} re-runs whenever the
 * source or language changes — including the first time the element is created,
 * however late that is.
 *
 * ## Usage
 *
 * Replace the interpolation with a binding:
 *
 * ```html
 * <!-- before: highlighted once, then frozen -->
 * <pre>{{ sanitized() }}</pre>
 *
 * <!-- after: highlighted, and live -->
 * <pre [hlCode]="sanitized()"></pre>
 *
 * <!-- a template sample, tokenised with the markup rules -->
 * <pre [hlCode]="templateSample" hlLang="html"></pre>
 * ```
 *
 * Leave program *output* alone, or pass `hlLang="text"`: a console log is not
 * source, and colouring it as if it were teaches the reader the wrong thing
 * about what they are looking at.
 *
 * @see highlighter.ts for the tokeniser and the `.hl-*` classes it emits.
 * @see app.ts for the navigation sweep this supersedes for dynamic blocks.
 */
@Directive({
  selector: 'pre[hlCode]',
})
export class HighlightCode {
  /** The source text. Plain text, not HTML — it is escaped before it is shown. */
  readonly hlCode = input.required<string>();

  /** Which tokeniser to run. `'text'` means "this is output, not source". */
  readonly hlLang = input<HighlightLang>('ts');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Claims the element before the navigation sweep's setTimeout can run, so
    // the two never race over the same `<pre>`.
    this.host.nativeElement.dataset['hl'] = '';

    effect(() => {
      this.host.nativeElement.innerHTML = highlight(this.hlCode(), this.hlLang());
    });
  }
}
