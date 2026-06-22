import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-i18n',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Internationalization (i18n)</h1>
      <p class="lead">
        Angular's built-in i18n extracts translatable text at <strong>build time</strong>
        and produces one optimized bundle per locale — no runtime translation lookup
        cost. You mark text in templates, extract it, translate, and build each locale.
      </p>

      <h2>Mark text with the i18n attribute</h2>
      <div class="code">
        <pre>&lt;h1 i18n&gt;Welcome back&lt;/h1&gt;

&lt;!-- meaning|description and an explicit id help translators --&gt;
&lt;p i18n="greeting|A friendly hello&#64;&#64;homeGreeting"&gt;Hello!&lt;/p&gt;

&lt;!-- attributes too --&gt;
&lt;img [src]="logo" i18n-alt alt="Company logo" /&gt;</pre>
      </div>

      <h2>Plurals &amp; selects (ICU)</h2>
      <div class="code">
        <pre>&lt;span i18n&gt;{{ '{' }}count, plural,
  =0 {{ '{' }}no items{{ '}' }}
  =1 {{ '{' }}one item{{ '}' }}
  other {{ '{' }}{{ '{{' }}count{{ '}}' }} items{{ '}' }}
{{ '}' }}&lt;/span&gt;</pre>
      </div>

      <h2>In TypeScript: $localize</h2>
      <div class="code">
        <pre>const msg = &#36;localize\`Welcome, &#36;{{ '{' }}name{{ '}' }}:name:!\`;</pre>
      </div>

      <h2>Extract, translate, build</h2>
      <div class="code">
        <pre>ng extract-i18n --output-path src/locale     // → messages.xlf

// translate into messages.fr.xlf, messages.es.xlf, …
// configure locales in angular.json "i18n" + per-locale build configs

ng build --localize          // emits one app per locale (dist/fr, dist/es, …)</pre>
      </div>

      <div class="tip">
        Each locale is a <strong>separate build</strong>, so there is zero runtime
        translation overhead — you serve the right one via the URL or server. For
        runtime language switching instead, a library like <code>&#64;ngx-translate</code>
        is the common alternative.
      </div>
      <div class="note">
        Keep <strong>stable custom IDs</strong> (<code>&#64;&#64;myId</code>) so a translation
        survives copy edits to the source text — otherwise changing a word orphans its
        translation. Locale-aware pipes (<code>date</code>, <code>currency</code>,
        <code>number</code>) need the locale data registered via
        <code>registerLocaleData()</code> and the right <code>LOCALE_ID</code>. ICU
        <code>plural</code>/<code>select</code> handle grammar that varies by language
        (e.g. languages with several plural forms).
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <code>i18n</code> attribute marks template text (and <code>i18n-*</code> marks attributes).</li>
        <li>Use <code>meaning|description&#64;&#64;id</code> to guide translators and keep stable ids.</li>
        <li>ICU expressions handle plurals and gender/selects.</li>
        <li><code>ng extract-i18n</code> → translate → <code>ng build --localize</code> per locale.</li>
      </ul>

      <p><a routerLink="/a11y">Next: Accessibility (a11y) →</a></p>
    </article>
  `,
})
export class I18n {}
