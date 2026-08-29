import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
 * Lesson: internationalization in depth — compile-time (@angular/localize)
 * vs runtime libraries, message anatomy (meaning|description@@id) and why
 * stable IDs matter (live orphaning demo), ICU plurals/selects with a live
 * branch simulator, $localize, the extract→translate→build pipeline, locale
 * data + pipes (live Intl formatter), serving strategies, and pitfalls.
 */
@Component({
  selector: 'app-lesson-i18n',
  imports: [RouterLink],
  styleUrl: './i18n.css',
  templateUrl: './i18n.html',
})
export class I18n {
  // --- id stability demo ---
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

  // --- ICU demos ---
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
  readonly icuBranch = computed(() => (this.count() === 0 ? '=0' : this.count() === 1 ? '=1' : 'other'));
  /**
   * The rendered plural message.
   */
  readonly icuResult = computed(() => {
    const c = this.count();
    return c === 0 ? 'no items in your cart' : c === 1 ? 'one item in your cart' : `${c} items in your cart`;
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
    this.gender() === 'male' ? 'Invite him' : this.gender() === 'female' ? 'Invite her' : 'Invite them',
  );

  // --- Intl locale formatter demo ---
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
  readonly fmtNumber = computed(() => new Intl.NumberFormat(this.locale()).format(this.sampleNumber));
  /**
   * The number as currency. Same amount, different symbol *and* different symbol
   * placement, which is why hand-formatting money never survives a second locale.
   */
  readonly fmtCurrency = computed(() =>
    new Intl.NumberFormat(this.locale(), { style: 'currency', currency: 'EUR' }).format(this.sampleNumber),
  );
  /**
   * The active locale's text direction. RTL is a layout problem, not a string one.
   */
  readonly direction = computed(() => (this.locale() === 'ar-EG' ? 'rtl ←' : 'ltr →'));

  // --- code samples ---
  /**
   * Sample: marking text with `i18n`, and the `meaning|description@@id` syntax.
   */
  readonly markSample = `<h1 i18n>Welcome back</h1>

<!-- meaning|description@@customId — all three optional, all three useful -->
<p i18n="greeting|Shown on the home hero@@homeGreeting">Hello!</p>

<!-- attributes translate with i18n-<attr> -->
<img [src]="logo" i18n-alt alt="Company logo" />
<input i18n-placeholder placeholder="Search lessons…" />`;

  /**
   * Sample: ICU plural and select expressions, which exist because plural rules
   * are not two-branch outside English.
   */
  readonly icuSample = `<span i18n>{count, plural,
  =0 {no items in your cart}
  =1 {one item in your cart}
  other {{{count}} items in your cart}
}</span>

<!-- select: branch on a value -->
<span i18n>{gender, select, male {Invite him} female {Invite her} other {Invite them}}</span>

<!-- a Polish translation of the same message declares ITS OWN branches: -->
{count, plural, one {…} few {…} many {…} other {…}}`;

  /**
   * Sample: `$localize`, for strings that live in TypeScript rather than a
   * template.
   */
  readonly localizeSample = `// tagged template literal — extracted like template messages
const saved = $localize\`:toast|Shown after saving:Your changes were saved\`;

// placeholders get names the translator can see and reposition:
const greet = $localize\`Welcome, \${this.name}:name:!\`;`;

  /**
   * Sample: the pipeline — `ng extract-i18n`, translated XLIFF files, and one
   * build per locale.
   */
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

  /**
   * Sample: `registerLocaleData` and `LOCALE_ID`, for setting a locale by hand in
   * a single-locale deployment.
   */
  readonly localeDataSample = `// localized builds set LOCALE_ID and register data automatically.
// doing it by hand (e.g. single-locale deployment):
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);
providers: [{ provide: LOCALE_ID, useValue: 'fr' }]

// now the pipes agree with the locale:
{{ today | date:'fullDate' }}   {{ price | currency:'EUR' }}`;
}
