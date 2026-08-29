import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Which boot path the comparison is showing.
 */
type Boot = 'destructive' | 'hydrated';

const BOOT_STEPS: Record<Boot, { title: string; steps: { text: string; bad?: boolean }[] }> = {
  destructive: {
    title: 'Without hydration (destructive re-render)',
    steps: [
      { text: 'Server HTML arrives — the user sees real content' },
      { text: 'JS bundles download; Angular bootstraps' },
      { text: 'Angular THROWS AWAY the server-rendered DOM', bad: true },
      {
        text: 'Everything re-renders from scratch — visible flicker, layout shift (CLS)',
        bad: true,
      },
      { text: 'Focus, selection and scroll state inside the content are lost', bad: true },
      { text: 'Media elements (video, iframes) reload', bad: true },
      { text: 'App interactive — after paying for a full second render' },
    ],
  },
  hydrated: {
    title: 'With provideClientHydration()',
    steps: [
      { text: 'Server HTML arrives — annotated with hydration metadata (ngh)' },
      { text: 'JS bundles download; Angular bootstraps' },
      { text: 'Angular WALKS the existing DOM, matching it to the component tree' },
      { text: 'Existing nodes are adopted — nothing is destroyed or re-created' },
      { text: 'Event listeners attach; internal state wires up' },
      { text: 'No flicker, no layout shift, media keeps playing' },
      { text: 'App interactive — the first render was the only render' },
    ],
  },
};

/**
 * One hydration mismatch: what causes it, and what Angular logs when it
 * happens.
 */
interface Mismatch {
  label: string;
  error: string;
  cause: string;
  fix: string;
}

const MISMATCHES: Mismatch[] = [
  {
    label: 'Direct DOM manipulation',
    error: 'NG0500: hydration node mismatch',
    cause:
      'Code (or a third-party script) added/moved DOM nodes outside Angular — innerHTML on an ElementRef, a jQuery plugin, a cookie banner injecting itself. The server HTML no longer matches what Angular expects to find.',
    fix: 'Move DOM work into afterNextRender (browser-only, post-hydration), render through templates instead, or put ngSkipHydration on the component hosting the widget.',
  },
  {
    label: 'Invalid HTML nesting',
    error: 'NG0500 — usually deep inside a table or list',
    cause:
      'The template contains HTML the browser "corrects" while parsing: <table> without <tbody> (browser inserts one), a <div> inside a <p> (browser closes the <p> early), nested <a> tags. The parsed DOM differs from the template structure, so node matching derails.',
    fix: 'Write valid HTML: add the tbody explicitly, never block elements inside <p>. Validate with the W3C checker if the error location looks baffling.',
  },
  {
    label: 'Different server vs client output',
    error: 'NG0500 / text-content mismatch',
    cause:
      'The template renders values that differ per run: Date.now(), Math.random(), locale-dependent formatting, or platform-branched markup (if (isBrowser) in the template path).',
    fix: 'Render deterministic values; compute volatile ones after hydration (afterNextRender + signal). Keep server and client rendering the same markup, always.',
  },
  {
    label: 'Whitespace / comment differences',
    error: 'silent corruption or NG0500',
    cause:
      'HTML minifiers, CDNs, or proxies that rewrite the server response (strip comments, collapse whitespace) destroy the hydration annotations and node positions Angular relies on.',
    fix: 'Serve the SSR output byte-for-byte: disable HTML minification/rewriting layers for document responses.',
  },
  {
    label: 'i18n blocks (older versions)',
    error: 'hydration skipped for the block',
    cause:
      'i18n-translated regions originally were not hydratable — Angular fell back to destroying and re-rendering them.',
    fix: 'Modern Angular supports it: enable withI18nSupport() in provideClientHydration.',
  },
];

/**
 * Lesson: hydration in depth — destructive vs hydrated bootstrap, how DOM
 * adoption works under the hood (ngh annotations), the strict rules it
 * imposes (matching DOM, valid HTML), the mismatch-error clinic (NG0500 &
 * friends), ngSkipHydration, event replay, and incremental hydration with
 * @defer (hydrate ...) triggers.
 *
 * Interactive: a bootstrap comparator (destructive vs hydrated, step by
 * step) and a mismatch clinic mapping each classic cause to its fix.
 */
@Component({
  selector: 'app-lesson-hydration',
  imports: [RouterLink],
  styleUrl: './hydration.css',
  templateUrl: './hydration.html',
})
export class Hydration {
  /**
   * The two boot paths.
   */
  readonly boots: Boot[] = ['destructive', 'hydrated'];
  /**
   * The steps each boot path goes through.
   */
  readonly bootSteps = BOOT_STEPS;
  /**
   * The boot path being shown.
   */
  readonly boot = signal<Boot>('destructive');

  /**
   * The known mismatch causes.
   */
  readonly mismatches = MISMATCHES;
  /**
   * The mismatch being examined, or `null` for none.
   */
  readonly activeMismatch = signal<Mismatch | null>(null);

  /**
   * Sample: `provideClientHydration`, with `withEventReplay` and
   * `withIncrementalHydration`.
   */
  readonly enableSample = `import { provideClientHydration, withEventReplay, withIncrementalHydration }
  from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),           // capture & replay pre-hydration clicks
      withIncrementalHydration(),  // enable @defer (hydrate ...) triggers
    ),
  ],
};`;

  /**
   * Sample: the `ngh` annotations the server emits — the map the client runtime
   * uses to walk the existing DOM instead of rebuilding it.
   */
  readonly annotatedSample = `<!-- simplified server output: metadata the client runtime navigates by -->
<app-root ngh="0">
  <header ngh="1">…</header>
  <!--ngh: container start (the @for block claimed 3 root nodes)-->
  <article>…</article>
  <article>…</article>
  <article>…</article>
  <!--ngh: container end-->
</app-root>
<script id="ng-state" type="application/json">
  { "__nghData__": [...], "transfer-cache": { ... } }
</script>`;

  /**
   * Sample: event replay. Without it, clicks landing between paint and hydration
   * are simply lost — which is exactly the window a fast-looking SSR page invites
   * the user to click in.
   */
  readonly replaySample = `provideClientHydration(withEventReplay())

// timeline without replay:
//   HTML painted ──── user clicks "Add to cart" ──── hydration done
//                      └─ click hits a listener-less button: LOST
// with replay:
//   the click is recorded at the document root and re-dispatched
//   to the real listener the moment hydration attaches it`;

  /**
   * Sample: incremental hydration with `@defer (hydrate on …)`, which ships the
   * server-rendered markup immediately and attaches its JavaScript only when the
   * trigger fires.
   */
  readonly incrementalSample = `@defer (hydrate on viewport) {
  <app-comments />        <!-- server-rendered NOW, visible immediately;
                               its JS loads & attaches when scrolled into view -->
} @placeholder {
  <div>…</div>            <!-- used only by client-side navigations,
                               where there is no server HTML to adopt -->
}

@defer (hydrate never) {
  <app-static-footer />   <!-- stays inert server HTML forever: zero JS shipped -->
}`;
}
