import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  viewChild,
} from '@angular/core';

/**
 * Renders a reader's HTML and CSS into a sandboxed `<iframe>`.
 *
 * The frame is `sandbox=""` — no scripts, no forms, no same-origin access — and
 * its document is set through `srcdoc`, so nothing the reader types can reach
 * the page, its storage, or the network. The page's Content Security Policy is
 * inherited by the frame, which is why the preview *cannot* run JavaScript
 * even if the sandbox were loosened: inline scripts are blocked by
 * `script-src 'self'`. Inline `<style>` is allowed, which is all a markup
 * preview needs.
 *
 * `srcdoc` is assigned imperatively rather than bound. Angular treats a bound
 * `srcdoc` as HTML and sanitises it — stripping `<style>`, which would defeat
 * the point — and the alternative, `bypassSecurityTrustHtml`, would be a lie
 * about what is being trusted. Nothing here is trusted; it is sandboxed.
 */
@Component({
  selector: 'app-html-preview',
  template: ` <iframe #frame class="preview" sandbox="" [title]="title()"></iframe> `,
  styles: `
    .preview {
      display: block;
      width: 100%;
      min-height: 14rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HtmlPreview {
  /** A fragment or a whole document. A fragment is wrapped in a minimal page. */
  readonly html = input.required<string>();

  /** Injected into the document's `<head>`, after any styles it already has. */
  readonly css = input('');

  /** The frame's title — its accessible name. */
  readonly title = input('Preview');

  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  constructor() {
    afterRenderEffect(() => {
      this.frame().nativeElement.srcdoc = buildPreviewDocument(this.html(), this.css());
    });
  }
}

/** Base styling so a bare fragment looks like a page rather than a browser default. */
const BASE_STYLE = `body { margin: 1rem; font-family: system-ui, sans-serif; line-height: 1.5; color: #18181b; background: #fff; }`;

/**
 * Wraps a fragment in a document, or injects the CSS into a document the
 * reader wrote themselves. Exported so it can be tested without a frame.
 */
export function buildPreviewDocument(html: string, css: string): string {
  const style = css ? `<style>${css}</style>` : '';
  if (/<html[\s>]/i.test(html)) {
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${style}</head>`);
    return html.replace(/<html([^>]*)>/i, `<html$1><head><meta charset="utf-8">${style}</head>`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style>${style}</head><body>${html}</body></html>`;
}
