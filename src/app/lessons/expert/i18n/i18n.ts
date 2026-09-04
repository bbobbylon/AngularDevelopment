import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

const LOCALES = ['en-US', 'de-DE', 'fr-FR', 'pl-PL', 'ja-JP', 'ar-EG'] as const;
/**
 * One of the demo locales.
 */
type LocaleTag = (typeof LOCALES)[number];

/** djb2 — stands in for Angular's real message-id hashing to show the principle. */
function hashId(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/**
 * Lesson: internationalization in depth — compile-time (`@angular/localize`) vs
 * runtime libraries vs the little-known `loadTranslations()` middle path,
 * message anatomy (`meaning|description@@id`) and why stable ids matter (live
 * orphaning demo), ICU plurals/selects with a live branch simulator, the
 * `i18n-<attr>` static-text-only trap, `$localize`, the install step nobody
 * mentions, the extract → translate → build pipeline, locale data + pipes
 * (live `Intl` formatter, `LOCALE_ID` vs `DEFAULT_CURRENCY_CODE`), and
 * failure modes.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem before naming the mechanism.** The page opens on the
 *    assumption everyone brings from other tooling — "it's just a JSON lookup,
 *    right?" — and makes the reader commit to a guess before finding out that
 *    Angular's built-in path is nothing of the sort.
 * 2. **Analogy before vocabulary.** A menu printed once per language versus one
 *    menu with a QR code per dish gives the reader somewhere to *put*
 *    "compile-time" and "runtime" before those words have to carry any weight
 *    on their own.
 * 3. **Then the same idea in several modes** — a dialogue between the two
 *    philosophies, a taped row of i18n's four separate jobs, annotated
 *    snippets for every syntax, a wrong/right comparison for the two traps
 *    people reliably fall into, and four live demos.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## Coverage-sweep findings folded in (docs/COVERAGE-SWEEP.md → `expert/i18n`)
 *
 * - installation is never mentioned in the previous version — added as its own
 *   section with the two distinct failure modes (compile-time vs runtime);
 * - `LOCALE_ID` does not set the currency pipe's currency — `DEFAULT_CURRENCY_CODE`
 *   does — added to the locale-data code sample, a `Predict`, and a `Remember` rule;
 * - `i18n-<attr>` only works on static attributes — added as a wrong/right `Compare`
 *   with `$localize` in the class and `<ng-container i18n>` as the wrapper-free option;
 * - the runtime path of `@angular/localize` itself (`loadTranslations`) was missing
 *   entirely, making the compile-vs-runtime table a false dichotomy — added as its
 *   own subsection and referenced from the FAQ's language-switcher question.
 *
 * ## Demos on this page
 *
 * - the id-orphaning box (`sourceText`, `autoId`) — the original demo, kept;
 * - the ICU plural/select simulator (`count`, `gender`) — the original demo, kept;
 * - the `Intl` locale formatter (`locale`, `fmtDate`/`fmtNumber`/`fmtCurrency`) —
 *   the original demo, kept.
 */
@Component({
  selector: 'app-lesson-i18n',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './i18n.css',
  templateUrl: './i18n.html',
})
export class I18n {
  // ── id-stability demo ──────────────────────────────────────────────────────
  /**
   * The source text in the message-id demo. Editable, which is the point.
   */
  readonly sourceText = signal('Welcome back');
  /**
   * The id the original text hashed to.
   */
  readonly originalAutoId = hashId('Welcome back');
  /**
   * The id the current text hashes to.
   *
   * Watching this change as the text is edited is the lesson: an auto-generated id
   * is a hash of the source string, so fixing a typo in English orphans every
   * translation of that message. A custom `@@id` is what pins it.
   */
  readonly autoId = computed(() => hashId(this.sourceText()));

  // ── ICU demos ───────────────────────────────────────────────────────────────
  /**
   * The count driving the plural demo.
   */
  readonly count = signal(1);
  /**
   * Decrements the count, floored at zero.
   */
  dec() {
    this.count.update((c) => Math.max(0, c - 1));
  }
  /**
   * Which ICU branch the current count selects.
   */
  readonly icuBranch = computed(() =>
    this.count() === 0 ? '=0' : this.count() === 1 ? '=1' : 'other',
  );
  /**
   * The rendered plural message.
   */
  readonly icuResult = computed(() => {
    const c = this.count();
    return c === 0
      ? 'no items in your cart'
      : c === 1
        ? 'one item in your cart'
        : `${c} items in your cart`;
  });

  /**
   * The genders in the select demo.
   */
  readonly genders = ['male', 'female', 'other'] as const;
  /**
   * The selected gender.
   */
  readonly gender = signal<'male' | 'female' | 'other'>('other');
  /**
   * The rendered select message.
   */
  readonly genderResult = computed(() =>
    this.gender() === 'male'
      ? 'Invite him'
      : this.gender() === 'female'
        ? 'Invite her'
        : 'Invite them',
  );

  // ── Intl locale formatter demo ─────────────────────────────────────────────
  /**
   * The demo locales.
   */
  readonly locales = LOCALES;
  /**
   * The active locale.
   */
  readonly locale = signal<LocaleTag>('en-US');
  /**
   * A fixed date, so the formatting differences are the only thing changing.
   */
  private readonly sampleDate = new Date(2026, 6, 6);
  /**
   * A fixed number, likewise.
   */
  private readonly sampleNumber = 1234567.89;

  /**
   * The date, formatted for the active locale.
   */
  readonly fmtDate = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' }).format(this.sampleDate),
  );
  /**
   * The number, formatted for the active locale — note the separators swapping.
   */
  readonly fmtNumber = computed(() =>
    new Intl.NumberFormat(this.locale()).format(this.sampleNumber),
  );
  /**
   * The number as currency. Same amount, different symbol *and* different symbol
   * placement, which is why hand-formatting money never survives a second locale.
   */
  readonly fmtCurrency = computed(() =>
    new Intl.NumberFormat(this.locale(), { style: 'currency', currency: 'EUR' }).format(
      this.sampleNumber,
    ),
  );
  /**
   * The active locale's text direction. RTL is a layout problem, not a string one.
   */
  readonly direction = computed(() => (this.locale() === 'ar-EG' ? 'rtl ←' : 'ltr →'));

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Cross-Cutting track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Security', id: 'security' },
    { label: 'i18n' },
    { label: 'Accessibility', id: 'a11y' },
    { label: 'Animations', id: 'animations' },
    { label: 'View Transitions', id: 'view-transitions' },
  ];

  /**
   * The two philosophies, dramatized as an exchange with the same request put
   * to each one.
   *
   * This exists because the relationship it describes is the one learners
   * reliably get backwards under exam pressure: which system does the lookup,
   * and *when*. Staged as two back-to-back answers to the same question, the
   * difference is impossible to blur.
   */
  protected readonly philosophyTalk: BubbleTurn[] = [
    { who: 'Your component', says: 'I need to show `Save` in French.' },
    {
      who: 'Built-in i18n',
      says: "You don't — I already replaced `Save` with `Enregistrer` back at build time. There's no English string left in this bundle to look up.",
    },
    { who: 'Your component', says: 'Same question — but under the runtime-library build.' },
    {
      who: 'Runtime i18n',
      says: 'I kept `Save` as a key. Give me a moment — checking the French JSON I loaded over the network… `Enregistrer`. If that file had not arrived yet, you would have seen the raw key on screen.',
    },
  ];

  /**
   * Sample: marking text with `i18n`, the `meaning|description@@id` syntax, and
   * `<ng-container>` for a wrapper-free translation.
   */
  protected readonly markSample = `<h1 i18n>Welcome back</h1>

<!-- meaning|description@@customId — all three optional, all three useful -->
<p i18n="greeting|Shown on the home hero@@homeGreeting">Hello!</p>

<!-- attributes translate with i18n-<attr>, but only literal text — see below -->
<img [src]="logo" i18n-alt alt="Company logo" />
<input i18n-placeholder placeholder="Search lessons…" />

<!-- translate a run of text with no wrapper element of its own -->
<ng-container i18n>Welcome, friend.</ng-container>`;

  /** Line-by-line walkthrough of {@link markSample}. */
  protected readonly markNotes: CodeNote[] = [
    {
      line: 1,
      text: "Bare `i18n` marks this element's text content for extraction. No value is needed for the simple case — the element's own text **is** the message.",
    },
    {
      line: 4,
      text: 'The full syntax: `i18n="meaning|description@@customId"`. `greeting` is the **meaning** — it disambiguates identical source text, so a "Close" button and "Close" meaning nearby are separate messages. The text after `|` is the **description**, shown to the translator as context. `@@homeGreeting` pins a **custom id**.',
    },
    {
      line: 7,
      text: '`i18n-alt` is the attribute form — it translates the **static** string `"Company logo"` bound to `alt`. It has nothing to do with `[src]`, which is data, not translatable text.',
    },
    {
      line: 8,
      text: 'The same pattern for `placeholder`: `i18n-placeholder` translates the literal string, never a bound one.',
    },
    {
      line: 11,
      text: '`<ng-container i18n>` translates a run of text without adding a real element to the DOM. Reach for it whenever there is no natural element to hang `i18n` on.',
    },
  ];

  /** Compare, left: the attribute-trap wrong way — a bound value, nothing static to grab. */
  protected readonly attrTrapWrongSample = `<!-- title is built at runtime — i18n-title has no static string to grab -->
<button i18n-title [title]="'Delete ' + item.name">🗑</button>`;

  /** Compare, right: translate the fixed part in TypeScript, bind normally. */
  protected readonly attrTrapRightSample = `// component class — translate the fixed part yourself
protected readonly deleteLabel = $localize\`:delete button tooltip:Delete\`;

<!-- template — ordinary binding, already translated -->
<button [title]="deleteLabel + ' ' + item.name">🗑</button>`;

  /**
   * Sample: ICU plural and select expressions, which exist because plural
   * rules are not two-branch outside English.
   */
  protected readonly icuSample = `<span i18n>{count, plural,
  =0 {no items in your cart}
  =1 {one item in your cart}
  other {{{count}} items in your cart}
}</span>

<!-- select: branch on a value -->
<span i18n>{gender, select, male {Invite him} female {Invite her} other {Invite them}}</span>

<!-- a Polish translation of the same message declares ITS OWN branches: -->
{count, plural, one {…} few {…} many {…} other {…}}`;

  /** Line-by-line walkthrough of {@link icuSample}. */
  protected readonly icuNotes: CodeNote[] = [
    {
      line: 1,
      text: '`{count, plural, …}` is an **ICU plural expression**. `count` is the value driving the choice; `plural` says which grammar rule set to apply to it.',
    },
    {
      line: 2,
      text: '`=0` is an **exact-match** branch — literal zero, not the `other` catch-all. Exact matches always win over category names when both could apply.',
    },
    {
      line: 3,
      text: '`=1`, likewise: an exact match for one, independent of whatever the target language calls its "singular" category.',
    },
    {
      line: 4,
      text: '`other` is the **required catch-all** every plural expression must define. `{{count}}` inside it interpolates the number itself into whichever branch was chosen.',
    },
    {
      line: 8,
      text: '`select` is the same mechanism for a non-numeric branch: one named value (`gender`) chooses one of several fixed strings, and `other` is still the required fallback.',
    },
    {
      line: 11,
      text: 'The entire point of ICU: **the translation declares its own branch set.** English only ever needs `=0`/`=1`/`other`; the Polish translator writes `one`/`few`/`many`/`other` right here — your template and your component never have to know that.',
    },
  ];

  /**
   * Sample: `$localize`, for strings that live in TypeScript rather than a
   * template.
   */
  protected readonly localizeSample = `// tagged template literal — extracted like template messages
const saved = $localize\`:toast|Shown after saving:Your changes were saved\`;

// placeholders get names the translator can see and reposition:
const greet = $localize\`Welcome, \${this.name}:name:!\`;`;

  /** Line-by-line walkthrough of {@link localizeSample}. */
  protected readonly localizeNotes: CodeNote[] = [
    {
      line: 2,
      text: '`$localize` is a **tagged template function** — the same extractor that reads template `i18n` attributes reads calls to it. The leading `:toast|Shown after saving:` is the same meaning-and-description pair as the template syntax, just written inline instead of as an attribute value.',
    },
    {
      line: 5,
      text: "`${this.name}:name:` — the `:name` right after the interpolation **names** that placeholder for the translator. In the extracted XLIFF it shows up as `{$NAME}` instead of an anonymous `{$INTERPOLATION}`, so they can see what it is and move it to wherever the target language's word order actually needs it.",
    },
  ];

  /**
   * Sample: installing `@angular/localize` and what the schematic changes —
   * the step every other sample on this page silently assumes already happened.
   */
  protected readonly installSample = `ng add @angular/localize

# → adds the dependency to package.json
# → adds "types": ["@angular/localize"] to tsconfig.json
# → adds "@angular/localize/init" to the build target's polyfills

// angular.json, after the schematic has run:
"polyfills": ["@angular/localize/init", "zone.js"]`;

  /**
   * Sample: the middle path — `loadTranslations()`, `@angular/localize`'s own
   * runtime API. Not a library; not a per-locale build either.
   */
  protected readonly loadTranslationsSample = `import { loadTranslations } from '@angular/localize';

// fetched over the network, id → translated string — the very ids
// the "stable ids" section above is about pinning
loadTranslations(messagesFr);

bootstrapApplication(App, {
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
});`;

  /**
   * Sample: the pipeline — `ng extract-i18n`, translated XLIFF files, and one
   * build per locale.
   */
  protected readonly pipelineSample = `ng extract-i18n --output-path src/locale    # → messages.xlf (XLIFF)

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

  /** Line-by-line walkthrough of {@link pipelineSample}. */
  protected readonly pipelineNotes: CodeNote[] = [
    {
      line: 1,
      text: '`ng extract-i18n` walks every `i18n` attribute and `$localize` call and writes one `messages.xlf` — the **source-locale** file. It is not a translation, it is the list of things that need one.',
    },
    {
      line: 6,
      text: 'The `"i18n"` block in `angular.json` declares `sourceLocale` — the language your code is actually written in — and maps each target `locale` code to the XLIFF file that holds its translations.',
    },
    {
      line: 13,
      text: '`i18nMissingTranslation: "error"` fails the **build** the moment a translation is missing, instead of silently falling back to source-language text. This is the setting that turns a missing string from a production surprise into a CI failure.',
    },
    {
      line: 15,
      text: '`ng build --localize` runs one complete build per configured locale, each emitting its own optimized bundle under `dist/<app>/<locale>/` — this is why the bundle count equals the locale count.',
    },
    {
      line: 16,
      text: '`ng serve --configuration=fr` serves a single locale during development, so checking one translation does not mean rebuilding every locale first.',
    },
  ];

  /**
   * Sample: `registerLocaleData` and `LOCALE_ID` for a hand-rolled single-locale
   * deployment — extended with `DEFAULT_CURRENCY_CODE`, the token most people
   * assume `LOCALE_ID` already covers.
   */
  protected readonly localeDataSample = `// localized builds set LOCALE_ID and register data automatically.
// doing it by hand (e.g. a single-locale deployment):
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);
providers: [
  { provide: LOCALE_ID, useValue: 'fr' },
  { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' }, // NOT implied by locale
]

// now the pipes agree with the locale — and currency has a default:
{{ today | date:'fullDate' }}   {{ price | currency }}`;

  /** Line-by-line walkthrough of {@link localeDataSample}. */
  protected readonly localeDataNotes: CodeNote[] = [
    {
      line: 6,
      text: "`registerLocaleData` loads one locale's plural rules, date/number formats and month/day names into memory. Skip it in a manual (non-localized) build and the `date`/`number`/`currency` pipes throw **NG0701** the moment they run.",
    },
    {
      line: 8,
      text: "`LOCALE_ID` is what `date`, `number`, and the currency pipe's **grammar** — digit grouping, decimal separator, where the symbol sits — actually read. It says nothing about which currency.",
    },
    {
      line: 9,
      text: "`DEFAULT_CURRENCY_CODE` is the separate token that decides the `currency` pipe's currency when you do not pass one explicitly. A `fr` locale does not imply EUR — plenty of French speakers legitimately bill in CAD, CHF or USD.",
    },
    {
      line: 13,
      text: 'With both tokens set, `currency` (no argument) resolves through `DEFAULT_CURRENCY_CODE`, and `date` resolves through `LOCALE_ID`. Two different providers, two different facts.',
    },
  ];

  /**
   * The self-test.
   *
   * The distractors are the misconceptions this page exists to correct: that
   * ids match by meaning or position rather than by hashing the text, and that
   * a missing translation is always a hard build failure rather than a silent
   * fallback you have to opt out of. The `why` on each wrong answer names the
   * misconception rather than just restating the right answer (CONTRIBUTING §2A).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'It gets automatically re-linked — Angular matches translations by meaning, not exact text.',
      why: 'There is no meaning-matching step. Without a custom id, the id **is** a hash of the source text (and its `meaning`, if set) — change one character of either and you get a different hash, full stop.',
    },
    {
      text: 'It is orphaned: the id changes, the French file no longer has an entry for it, and the app falls back to the English text until someone retranslates it.',
      correct: true,
      why: 'Exactly this. The build itself does not fail — it just cannot find a translation for the new id, and `i18nMissingTranslation` decides what happens next: warn and fall back to source (the default), or fail the build (`"error"` — worth setting in CI).',
    },
    {
      text: 'The build fails immediately — a missing translation is always a hard error.',
      why: 'Only if `i18nMissingTranslation: "error"` is set. The CLI\'s own default is to warn and quietly fall back to source-language text, which is precisely how a stale translation ships to production unnoticed.',
    },
    {
      text: "Nothing changes — ids are based on the message's position in the file, not its text.",
      why: "Ids are content hashes, not positional. Reorder the whole template and every id stays put; edit one word of a message with no custom id and that message's id changes.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does built-in i18n need one whole build per locale? That feels heavy for ten strings.',
      a: 'Because it is not a lookup layer at all — the translated text physically replaces the source text in the compiled output, so there is no `Map` to consult at runtime and no way to serve two languages from one bundle. If ten strings really is all you have, a runtime library or `loadTranslations()` skips the multi-build cost; built-in i18n starts paying off once SEO, SSR, or a large string count make zero-runtime-cost worth the build complexity.',
    },
    {
      q: 'What is actually different between meaning and description in `i18n="meaning|description"`?',
      a: '`description` is a note **to the translator** — it never changes which message a piece of text belongs to. `meaning` does: two identical English strings with different meanings (a "Close" button vs. "Close" as in "nearby") are two separate messages with two separate ids, and can end up translated completely differently.',
    },
    {
      q: 'Why bother with ICU plurals instead of just `@if (count === 1)` in the template?',
      a: "Because English's two-branch grammar (one/other) is not universal, and hardcoding it bakes an English assumption into every other language's translation. ICU keeps the branching itself inside the translatable message, so a Polish translator can write four branches and an Arabic one can write six, without either of them touching your component or your template.",
    },
    {
      q: 'Product wants an in-app language switcher with no page reload. Does that rule out built-in i18n entirely?',
      a: "It rules out using built-in i18n for the switching itself — its compile-time bundles cannot swap without navigating to a different one. The runtime path is either a library (Transloco, ngx-translate) or `@angular/localize`'s own `loadTranslations()` if you would rather not add a dependency. Plenty of teams run both: built-in for the public, SEO-sensitive pages, runtime for the logged-in app where instant switching matters more than zero-lookup cost.",
    },
    {
      q: 'My app only ships in English today. Do I need any of this?',
      a: 'Less of it, but not none. Skip extraction and translation entirely — but `LOCALE_ID` and its registered locale data still decide how `date`, `number` and `currency` format, and getting that wrong (showing `1,234.56` to someone who reads `1.234,56`) is a real bug even in a single-locale app. The locale-data section further down is the part that still applies to you.',
    },
  ];

  /** Compare, left: string concatenation — the pitfall that breaks in most languages. */
  protected readonly concatWrongSample = `// breaks in any language where word order differs from English
const msg = 'You have ' + itemCount + ' items in your cart';`;

  /** Compare, right: one message, one placeholder — the translation controls word order. */
  protected readonly concatRightSample = `<!-- one message, one placeholder — the translation controls word order -->
<span i18n>You have {{ itemCount }} items in your cart</span>`;

  /** The extract → translate → build → deploy pipeline, as a diagram. */
  protected readonly pipelineFlow: FlowStep[] = [
    {
      label: 'Extract',
      detail: '`ng extract-i18n` walks every `i18n` and `$localize` → one `messages.xlf`',
    },
    {
      label: 'Translate',
      detail: 'A translator (or vendor) produces `messages.fr.xlf`, `messages.es.xlf` …',
      tone: 'accent',
    },
    { label: 'Build', detail: '`ng build --localize` — one full compile per configured locale' },
    {
      label: 'Deploy',
      detail: 'Route each locale to its own bundle: a subpath, a subdomain, or `Accept-Language`',
      tone: 'good',
    },
  ];
}
