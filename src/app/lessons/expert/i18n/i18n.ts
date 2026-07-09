import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: internationalization in depth — compile-time (@angular/localize)
 * vs runtime libraries, message anatomy (meaning|description@@id) and why
 * stable IDs matter (live orphaning demo), ICU plurals/selects with a live
 * branch simulator, $localize, the extract→translate→build pipeline, locale
 * data + pipes (live Intl formatter), serving strategies, and pitfalls.
 */

const LOCALES = ['en-US', 'de-DE', 'fr-FR', 'pl-PL', 'ja-JP', 'ar-EG'] as const;
type LocaleTag = (typeof LOCALES)[number];

/** djb2 — stands in for Angular's real message-id hashing to show the principle. */
function hashId(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

@Component({
  selector: 'app-lesson-i18n',
  imports: [RouterLink],
  styles: [`
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .id-box { font-family: monospace; font-size: .84rem; padding: 8px 12px; border-radius: 8px; margin: 6px 0; }
    .id-box.volatile { background: rgba(239,68,68,.1); color: #ef4444; }
    .id-box.stable { background: rgba(16,185,129,.1); color: var(--green); }

    .icu-out { font-size: 1.05rem; padding: 12px 16px; border: 1px dashed var(--border); border-radius: 10px; margin: 10px 0; }
    .icu-branch { font-family: monospace; font-size: .78rem; color: var(--accent); }

    .fmt-grid { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; font-size: .9rem; margin-top: 10px; }
    .fmt-grid dt { color: var(--text-muted); font-size: .8rem; align-self: center; }
    .fmt-grid dd { margin: 0; font-family: monospace; }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Internationalization (i18n)</h1>
      <p class="lead">
        Angular's built-in i18n translates at <strong>build time</strong>: text is
        extracted, translated, and compiled into one optimized bundle per locale —
        zero runtime lookup cost. This page covers the whole pipeline, ICU plural
        grammar, stable message IDs (and the orphaning trap), locale data, and when
        to choose a runtime library instead.
      </p>

      <h2>Two philosophies: compile-time vs runtime</h2>
      <table class="cmp">
        <tr><th></th><th>&#64;angular/localize (built-in)</th><th>runtime libs (ngx-translate, Transloco)</th></tr>
        <tr><td>When translated</td><td>at build — one bundle per locale</td><td>at runtime — JSON loaded &amp; looked up live</td></tr>
        <tr><td>Runtime cost</td><td>none (text is baked in)</td><td>lookup per string + translation files over the wire</td></tr>
        <tr><td>Switch language</td><td>load a different bundle (full reload / different URL)</td><td>instant, in place</td></tr>
        <tr><td>Bundle count</td><td>one per locale (dist/fr, dist/es…)</td><td>one total</td></tr>
        <tr><td>Type of app</td><td>content/SEO sites, SSR, most products</td><td>language switcher requirements, user-editable translations</td></tr>
      </table>
      <div class="note">
        The interview-ready framing: built-in i18n trades deploy complexity (n bundles,
        server routing per locale) for perfect runtime performance; runtime libraries
        trade a lookup layer for flexibility. Neither is "better" — the requirement
        "switch language without reload" decides it for you.
      </div>

      <h2>Marking text — the anatomy of a message</h2>
      <div class="code"><pre>{{ markSample }}</pre></div>
      <p>
        The full syntax is <code>i18n="meaning|description&#64;&#64;customId"</code>.
        The <em>description</em> tells the translator what this text is; the
        <em>meaning</em> disambiguates identical source text (the English "Close" on a
        button vs "Close" describing distance translate differently — different meaning,
        different message). The <em>&#64;&#64;customId</em> pins the message identity.
      </p>

      <h2>Why stable IDs matter — watch a translation get orphaned</h2>
      <div class="demo">
        <p class="demo__title">Interactive — edit the source text</p>
        <input style="width:100%" [value]="sourceText()" (input)="sourceText.set($any($event.target).value)" />
        <div class="id-box volatile">auto-generated id: {{ autoId() }} @if (autoId() !== originalAutoId) { — CHANGED: the old translation is now orphaned ✂ } @else { — matches the translation file ✓ }</div>
        <div class="id-box stable">custom id: &#64;&#64;homeGreeting — stable no matter how the text changes ✓</div>
        <p style="margin-top:8px;color:var(--text-muted);font-size:.85rem">
          Without a custom id, the message id is a hash of the source text (and meaning).
          Fix a typo → new id → every existing translation of it is orphaned and the
          text falls back to the source language. Real projects pin ids on
          high-traffic strings.
        </p>
      </div>

      <h2>Plurals &amp; selects — ICU expressions</h2>
      <p>
        "1 item" vs "2 items" is the easy case. Polish has <em>three</em> plural
        categories, Arabic six — ICU expressions delegate that grammar to the
        translation, where it belongs:
      </p>
      <div class="code"><pre>{{ icuSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Interactive — step the count, watch the branch</p>
        <div class="row">
          <button class="ghost" (click)="dec()">−</button>
          <strong style="min-width:2ch;text-align:center">{{ count() }}</strong>
          <button class="ghost" (click)="count.set(count() + 1)">+</button>
        </div>
        <div class="icu-out">
          {{ icuResult() }}
          <div class="icu-branch">matched branch: {{ icuBranch() }}</div>
        </div>
        <div class="row" style="margin-top:6px">
          <span style="font-size:.85rem;color:var(--text-muted)">select works the same for non-numeric cases:</span>
          @for (g of genders; track g) {
            <button class="ghost" [style.borderColor]="gender() === g ? 'var(--accent)' : ''" (click)="gender.set(g)">{{ g }}</button>
          }
          <span class="pill">{{ genderResult() }}</span>
        </div>
      </div>

      <h2>Text in TypeScript — $localize</h2>
      <p>
        Template <code>i18n</code> attributes can't reach strings built in code
        (toasts, error messages, titles). Tag them with <code>$localize</code> — the
        same extraction pipeline picks them up, and placeholders get names translators
        can see:
      </p>
      <div class="code"><pre>{{ localizeSample }}</pre></div>

      <h2>The pipeline: extract → translate → build</h2>
      <div class="code"><pre>{{ pipelineSample }}</pre></div>
      <p>
        Each locale is a <strong>separate application build</strong> under
        <code>dist/&lt;locale&gt;/</code>. Serving is a deployment concern: subpaths
        (<code>/fr/</code>, <code>/es/</code>) with server routing, or
        <code>Accept-Language</code> negotiation at the edge. SSR composes cleanly —
        each locale's server bundle renders its own language.
      </p>

      <h2>Locale data — what makes the pipes right</h2>
      <p>
        Translation is only half of i18n. Dates, numbers and currencies format
        differently per locale — Angular's <code>date</code>/<code>number</code>/<code>currency</code>
        pipes read registered locale data and <code>LOCALE_ID</code> (set automatically
        per localized build). See how much actually changes:
      </p>
      <div class="demo">
        <p class="demo__title">Interactive — the same values, six locales</p>
        <div class="chips">
          @for (l of locales; track l) {
            <button [class.on]="locale() === l" (click)="locale.set(l)">{{ l }}</button>
          }
        </div>
        <dl class="fmt-grid">
          <dt>date</dt><dd>{{ fmtDate() }}</dd>
          <dt>number</dt><dd>{{ fmtNumber() }}</dd>
          <dt>currency</dt><dd>{{ fmtCurrency() }}</dd>
          <dt>direction</dt><dd>{{ direction() }}</dd>
        </dl>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Separators swap (1.234.567,89 in German), currency symbols move, calendars and
          scripts change, and Arabic flips the reading direction — set
          <code>dir="rtl"</code> on <code>&lt;html&gt;</code> and audit your CSS with
          logical properties (<code>margin-inline-start</code> over
          <code>margin-left</code>).
        </p>
      </div>
      <div class="code"><pre>{{ localeDataSample }}</pre></div>

      <h2>Pitfalls</h2>
      <ul>
        <li><strong>Orphaned translations</strong> — source-text edits change auto ids (the
          demo above). Pin <code>&#64;&#64;ids</code> on strings you expect to tweak.</li>
        <li><strong>Missing translations</strong> — configure the build's
          <code>i18nMissingTranslation</code>: <code>error</code> for CI honesty, not the
          silent source-language fallback discovered by users.</li>
        <li><strong>NG0701 / blank formats</strong> — using locale pipes without that
          locale's data registered. Localized builds handle it; manual setups must call
          <code>registerLocaleData()</code>.</li>
        <li><strong>Concatenation breaks grammar</strong> — 'You have ' + n + ' items'
          is untranslatable in languages where word order differs. Always one message
          with placeholders, never string assembly.</li>
        <li><strong>Hydration + i18n</strong> — translated blocks need
          <code>withI18nSupport()</code> in <code>provideClientHydration()</code> or
          they fall back to destructive re-render.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does built-in i18n produce a bundle per locale?</summary>
        <div>Translation happens at compile time — the translated text replaces the source
        in the emitted code, so each locale is its own optimized build. Zero runtime
        lookup, but switching language means loading a different bundle.</div>
      </details>
      <details class="qa">
        <summary>What do meaning and description do in <code>i18n="meaning|description"</code>?</summary>
        <div>Description is context shown to the translator. Meaning participates in the
        message identity — two "Close" strings with different meanings are separate
        messages that can translate differently.</div>
      </details>
      <details class="qa">
        <summary>Why ICU plural instead of <code>&#64;if (count === 1)</code> in the template?</summary>
        <div>Plural category boundaries differ per language (Polish: 3 forms, Arabic: 6).
        ICU keeps the branching inside the translatable message so each language's
        translation declares its own branches — template logic would hardcode English
        grammar.</div>
      </details>
      <details class="qa">
        <summary>The product wants an in-app language switcher. Which approach?</summary>
        <div>A runtime library (ngx-translate/Transloco) — built-in i18n bakes one language
        per bundle, so "switching" means navigating to another build. If SEO/SSR also
        matters, some teams run both: built-in for the public site, runtime for the
        logged-in app.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Built-in i18n = compile-time: extract (<code>ng extract-i18n</code>) → translate XLF → <code>ng build --localize</code> → bundle per locale.</li>
        <li>Message anatomy: <code>meaning|description&#64;&#64;id</code> — pin custom ids or edits orphan translations.</li>
        <li>ICU plural/select moves language grammar into the translation, where it belongs.</li>
        <li><code>$localize</code> covers strings built in TypeScript.</li>
        <li>i18n ≠ translation only: locale data drives pipes, and RTL locales need <code>dir</code> + logical CSS.</li>
      </ul>

      <p><a routerLink="/a11y">Next: Accessibility (a11y) →</a></p>
    </article>
  `,
})
export class I18n {
  // --- id stability demo ---
  readonly sourceText = signal('Welcome back');
  readonly originalAutoId = hashId('Welcome back');
  readonly autoId = computed(() => hashId(this.sourceText()));

  // --- ICU demos ---
  readonly count = signal(1);
  dec() {
    this.count.update((c) => Math.max(0, c - 1));
  }
  readonly icuBranch = computed(() => (this.count() === 0 ? '=0' : this.count() === 1 ? '=1' : 'other'));
  readonly icuResult = computed(() => {
    const c = this.count();
    return c === 0 ? 'no items in your cart' : c === 1 ? 'one item in your cart' : `${c} items in your cart`;
  });

  readonly genders = ['male', 'female', 'other'] as const;
  readonly gender = signal<'male' | 'female' | 'other'>('other');
  readonly genderResult = computed(() =>
    this.gender() === 'male' ? 'Invite him' : this.gender() === 'female' ? 'Invite her' : 'Invite them',
  );

  // --- Intl locale formatter demo ---
  readonly locales = LOCALES;
  readonly locale = signal<LocaleTag>('en-US');
  private readonly sampleDate = new Date(2026, 6, 6);
  private readonly sampleNumber = 1234567.89;

  readonly fmtDate = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' }).format(this.sampleDate),
  );
  readonly fmtNumber = computed(() => new Intl.NumberFormat(this.locale()).format(this.sampleNumber));
  readonly fmtCurrency = computed(() =>
    new Intl.NumberFormat(this.locale(), { style: 'currency', currency: 'EUR' }).format(this.sampleNumber),
  );
  readonly direction = computed(() => (this.locale() === 'ar-EG' ? 'rtl ←' : 'ltr →'));

  // --- code samples ---
  readonly markSample = `<h1 i18n>Welcome back</h1>

<!-- meaning|description@@customId — all three optional, all three useful -->
<p i18n="greeting|Shown on the home hero@@homeGreeting">Hello!</p>

<!-- attributes translate with i18n-<attr> -->
<img [src]="logo" i18n-alt alt="Company logo" />
<input i18n-placeholder placeholder="Search lessons…" />`;

  readonly icuSample = `<span i18n>{count, plural,
  =0 {no items in your cart}
  =1 {one item in your cart}
  other {{{count}} items in your cart}
}</span>

<!-- select: branch on a value -->
<span i18n>{gender, select, male {Invite him} female {Invite her} other {Invite them}}</span>

<!-- a Polish translation of the same message declares ITS OWN branches: -->
{count, plural, one {…} few {…} many {…} other {…}}`;

  readonly localizeSample = `// tagged template literal — extracted like template messages
const saved = $localize\`:toast|Shown after saving:Your changes were saved\`;

// placeholders get names the translator can see and reposition:
const greet = $localize\`Welcome, \${this.name}:name:!\`;`;

  readonly pipelineSample = `ng extract-i18n --output-path src/locale    # → messages.xlf (XLIFF)

# translators produce messages.fr.xlf, messages.es.xlf, …

// angular.json — declare locales & translation files
"i18n": {
  "sourceLocale": "en-US",
  "locales": {
    "fr": "src/locale/messages.fr.xlf",
    "es": "src/locale/messages.es.xlf"
  }
},
"options": { "i18nMissingTranslation": "error" }

ng build --localize    # emits dist/<app>/fr, dist/<app>/es, …
ng serve --configuration=fr   # develop against one locale`;

  readonly localeDataSample = `// localized builds set LOCALE_ID and register data automatically.
// doing it by hand (e.g. single-locale deployment):
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);
providers: [{ provide: LOCALE_ID, useValue: 'fr' }]

// now the pipes agree with the locale:
{{ today | date:'fullDate' }}   {{ price | currency:'EUR' }}`;
}
