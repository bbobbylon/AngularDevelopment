import {
  DOCUMENT,
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';

/** Gap in px between the host element and the tooltip bubble. */
const OFFSET_PX = 8;

/** Counter behind the generated tooltip element ids used by `aria-describedby`. */
let nextTooltipId = 0;

/**
 * Shows a small text bubble describing the host element.
 *
 * ## Why the bubble lives on `<body>`
 *
 * The tooltip is created imperatively and appended to `document.body` rather
 * than rendered inside the host. Most hosts here sit inside cards and panels
 * that establish a clipping or stacking context (`overflow: hidden`,
 * `transform`, `position: relative`), which would crop the bubble or trap it
 * behind a sibling. Positioning it against the viewport from `<body>` sidesteps
 * both. The cost is that the bubble does not follow the host on scroll, which
 * is acceptable because it is only visible while hovered or focused.
 *
 * ## Accessibility
 *
 * A tooltip that only responds to the mouse is invisible to keyboard and
 * screen-reader users, so this directive:
 * - opens on `focusin` as well as `mouseenter`, and closes on `focusout`;
 * - closes on `Escape`, per the WAI-ARIA tooltip pattern, so a tooltip
 *   overlapping the content underneath can always be dismissed without moving
 *   focus away;
 * - gives the bubble `role="tooltip"` and a generated id, and points the host's
 *   `aria-describedby` at it while visible — the association assistive tech
 *   needs to announce the text.
 *
 * The host must be focusable for the keyboard path to work. Buttons, links and
 * inputs already are; on anything else add `tabindex="0"`.
 *
 * @example
 * <button appTooltip="Resets every answer on this page">Reset</button>
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class TooltipDirective implements OnDestroy {
  /**
   * The tooltip text. Aliased to the selector so the directive is applied and
   * configured by one attribute (`appTooltip="…"`). An empty value disables
   * the tooltip entirely rather than showing an empty bubble.
   */
  readonly text = input('', { alias: 'appTooltip' });

  /** The host, measured with `getBoundingClientRect()` to place the bubble. */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Used for all DOM mutation instead of direct `document` calls. */
  private readonly renderer = inject(Renderer2);

  /** Injected rather than using the global `document`, so the directive stays testable and SSR-safe. */
  private readonly doc = inject(DOCUMENT);

  /** The live bubble element, or `null` while hidden. Doubles as the open flag. */
  private tip: HTMLElement | null = null;

  /** Stable id for this instance's bubble, referenced by `aria-describedby`. */
  private readonly tipId = `app-tooltip-${nextTooltipId++}`;

  /**
   * Keeps an already-open bubble in sync with its text.
   *
   * Without this, a signal-driven label that changed while the tooltip was
   * showing would leave the stale string on screen until the next hover; and
   * clearing the text to `''` (the documented way to disable the tooltip)
   * would leave an empty bubble stuck open.
   */
  constructor() {
    effect(() => {
      const text = this.text();
      if (this.tip) this.renderer.setProperty(this.tip, 'textContent', text);
      if (this.tip && !text) this.hide();
    });
  }

  /**
   * Creates and positions the bubble, and links it to the host for assistive
   * tech. No-op when there is no text, or when a bubble is already open —
   * hovering a focused element fires both `focusin` and `mouseenter`, and
   * without the guard the second one would orphan the first bubble on `<body>`
   * with nothing left holding a reference to remove it.
   */
  show(): void {
    const text = this.text();
    if (!text || this.tip) return;

    const tip: HTMLElement = this.renderer.createElement('div');
    this.renderer.addClass(tip, 'app-tooltip');
    this.renderer.setAttribute(tip, 'role', 'tooltip');
    this.renderer.setAttribute(tip, 'id', this.tipId);
    this.renderer.appendChild(tip, this.renderer.createText(text));
    this.renderer.appendChild(this.doc.body, tip);

    // Horizontally centred on the host, vertically just below it. `scrollY` is
    // added because getBoundingClientRect() is viewport-relative while the
    // bubble is absolutely positioned in the document.
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(tip, 'left', `${rect.left + rect.width / 2}px`);
    this.renderer.setStyle(tip, 'top', `${rect.bottom + window.scrollY + OFFSET_PX}px`);

    this.renderer.setAttribute(this.el.nativeElement, 'aria-describedby', this.tipId);
    this.tip = tip;
  }

  /**
   * Removes the bubble and the `aria-describedby` link. Safe to call when
   * nothing is showing, which is what makes it usable as the handler for
   * `mouseleave`, `focusout`, `Escape` and teardown alike.
   */
  hide(): void {
    if (!this.tip) return;
    this.renderer.removeChild(this.doc.body, this.tip);
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-describedby');
    this.tip = null;
  }

  /**
   * Removes any open bubble on teardown. Essential here in a way it is not for
   * most directives: the bubble is parented to `<body>`, not to the host, so
   * destroying the host does not take it with it. Without this, navigating
   * away mid-hover leaves the tooltip stranded on screen forever.
   */
  ngOnDestroy(): void {
    this.hide();
  }
}
