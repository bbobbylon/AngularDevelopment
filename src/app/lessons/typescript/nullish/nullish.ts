import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Optional chaining & nullish coalescing — exact short-circuit
 * semantics (?. always yields undefined, never null; the whole chain tail is
 * skipped), the || vs ?? falsy-vs-nullish distinction with a live comparison
 * demo, the logical-assignment trio, both flavors of the ! assertion, and how
 * strictNullChecks makes all of it matter.
 */

interface Profile {
  name: string;
  address?: { city?: string };
  prefs?: { theme?: string };
}

type Falsyish = 0 | '' | false | null | undefined;

interface FalsyCase {
  label: string;
  value: Falsyish;
}

const FALSY_CASES: FalsyCase[] = [
  { label: '0', value: 0 },
  { label: "''", value: '' },
  { label: 'false', value: false },
  { label: 'null', value: null },
  { label: 'undefined', value: undefined },
];

@Component({
  selector: 'app-lesson-ts-nullish',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Optional Chaining & Nullish Coalescing</h1>
      <p class="lead">
        These operators exist because of one design decision: under
        <code>strictNullChecks</code> (on in every Angular project),
        <code>null</code> and <code>undefined</code> are <em>not</em> members of
        other types — a <code>string | undefined</code> won't let you call
        <code>.trim()</code> until you've dealt with the undefined case.
        <code>?.</code> and <code>??</code> are the concise, precise way to deal
        with it. The precision matters: both operators react to <em>nullish</em>
        (null/undefined) only, never to falsy — the distinction this page drills.
      </p>

      <h2>Optional chaining <code>?.</code> — exact semantics</h2>
      <div class="code"><pre>user?.address?.city          // undefined instead of a crash
user?.greet?.()              // call only if greet is non-nullish
list?.[0]                    // safe index access — ?. before [ ] and ( ) too</pre></div>
      <p>Three rules that hold in every case:</p>
      <ul>
        <li><strong>It checks nullish, not falsy.</strong> <code>''?.length</code> is <code>0</code>, not undefined — an empty string is a perfectly good string.</li>
        <li><strong>It always produces <code>undefined</code></strong> when it short-circuits — even if the value it tested was <code>null</code>. (<code>null?.x === undefined</code>, never null.) That's why result types read <code>T | undefined</code>.</li>
        <li><strong>It short-circuits the <em>entire chain tail</em>.</strong> In <code>a?.b.c.d()</code>, if <code>a</code> is nullish, none of <code>.b.c.d()</code> evaluates — no property reads, no calls, no side effects. You don't need <code>?.</code> at every link, only after each value that can itself be nullish.</li>
      </ul>
      <div class="code"><pre>a?.b.c        // safe against a being nullish — but crashes if a.b is nullish!
a?.b?.c       // safe against both. Put ?. exactly where nullability exists —
              // scattering ?. everywhere hides which links can ACTUALLY be missing.</pre></div>

      <h2>Nullish coalescing <code>??</code> — and the <code>||</code> trap</h2>
      <p>
        <code>a ?? b</code> yields <code>b</code> only when <code>a</code> is
        <code>null</code> or <code>undefined</code>. <code>a || b</code> yields
        <code>b</code> whenever <code>a</code> is <em>falsy</em> — which wrongly
        swallows <code>0</code>, <code>''</code> and <code>false</code>, all
        legitimate values. Classic real bugs: a volume setting of 0 resetting to the
        default, an empty-string search box reverting to a placeholder query,
        <code>showBanner: false</code> being ignored.
      </p>
      <div class="demo">
        <p class="demo__title">Live — <code>value || 'fallback'</code> vs <code>value ?? 'fallback'</code></p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (c of falsyCases; track c.label) {
            <button [class.ghost]="picked().label !== c.label" (click)="picked.set(c)">{{ c.label }}</button>
          }
        </div>
        <table class="t">
          <tr><th>expression</th><th>result</th></tr>
          <tr>
            <td><code>{{ picked().label }} || 'fallback'</code></td>
            <td><strong>{{ orResult() }}</strong></td>
          </tr>
          <tr>
            <td><code>{{ picked().label }} ?? 'fallback'</code></td>
            <td><strong>{{ nullishResult() }}</strong></td>
          </tr>
        </table>
        <p style="font-size:.88rem;color:var(--text-muted);margin-top:8px">
          They agree only on null/undefined. For <code>0</code>, <code>''</code> and
          <code>false</code>, <code>||</code> discards a real value; <code>??</code> keeps it.
        </p>
      </div>
      <div class="warn">
        You can't mix <code>??</code> with <code>||</code> or <code>&amp;&amp;</code> without
        parentheses — <code>a ?? b || c</code> is a <strong>syntax error</strong> by spec
        (the committee refused to define a precedence people would misremember). Be
        explicit: <code>(a ?? b) || c</code>.
      </div>

      <h2>Combine them — the canonical read pattern</h2>
      <div class="code"><pre>const city = user?.address?.city ?? 'Unknown';
//            └── may be undefined ──┘  └─ so give it a floor
const theme = profile?.prefs?.theme ?? 'dark';</pre></div>
      <p>
        This pair is the idiom: <code>?.</code> converts "might crash" into "might be
        undefined", and <code>??</code> converts "might be undefined" into "always a
        value". After the line runs, <code>city</code> is plain <code>string</code> —
        the compiler agrees, no assertions needed.
      </p>

      <div class="demo">
        <p class="demo__title">Live — chaining through a partial profile</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="full()">full profile</button>
          <button (click)="partial()">missing address</button>
          <button (click)="empty()">null profile</button>
        </div>
        <p><code>city = profile?.address?.city ?? 'Unknown'</code></p>
        <p>→ <strong>{{ city() }}</strong></p>
        <p style="font-size:.88rem;color:var(--text-muted)">
          "missing address" short-circuits at the second link; "null profile" at the
          first. Both land on <code>undefined</code>, and <code>??</code> supplies the floor.
        </p>
      </div>

      <h2>The logical-assignment trio</h2>
      <div class="code"><pre>options.timeout ??= 3000;   // assign only if currently null/undefined — defaulting
cache.user ||= fetchGuest(); // assign if falsy (rarely what you want — see above)
draft &amp;&amp;= sanitize(draft);   // assign only if currently truthy</pre></div>
      <p>
        All three <strong>short-circuit the assignment itself</strong>:
        <code>a ??= b</code> doesn't even evaluate <code>b</code> (or trigger a
        setter on <code>a</code>) when <code>a</code> is already non-nullish. That
        makes <code>??=</code> ideal for lazy initialization — the expensive
        right-hand side runs at most once.
      </p>

      <h2><code>!</code> — two assertions, zero runtime checks</h2>
      <div class="code"><pre>// 1. non-null assertion (expression position): "trust me, not null"
const el = document.querySelector('#app')!;

// 2. definite assignment assertion (declaration position):
//    "this field IS assigned before use, even though no initializer is visible"
class Comp {{ '{' }}
  data!: string[];   // e.g. populated by a framework before you read it
{{ '}' }}</pre></div>
      <div class="warn">
        Both flavors silence the compiler and add <strong>no runtime check</strong> —
        if you're wrong, the crash still happens, just further from the lie. Prefer a
        real guard, <code>?.</code>/<code>??</code>, or in Angular:
        <code>input.required&lt;T&gt;()</code> and signal-based queries, which remove
        the classic "populated later by the framework" cases where <code>!</code>
        used to be routine.
      </div>

      <h2>In Angular templates</h2>
      <div class="code"><pre>&lt;p&gt;{{ '{{' }} user()?.address?.city ?? 'n/a' {{ '}}' }}&lt;/p&gt;

&#64;if (user()?.address; as addr) {{ '{' }}
  &lt;p&gt;{{ '{{' }} addr.city {{ '}}' }}&lt;/p&gt;   &lt;!-- narrowed once, used clean --&gt;
{{ '}' }}</pre></div>
      <p>
        Template expressions support both operators with identical semantics. When a
        template reads several members off the same maybe-nullish object, prefer the
        <code>&#64;if (…; as x)</code> form — one check, then plain reads — over
        repeating <code>?.</code> on every binding.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary><code>null?.foo</code> — what's the value, and why isn't it <code>null</code>?</summary>
        <div><code>undefined</code>. Optional chaining normalizes both nullish inputs
        to <code>undefined</code> on short-circuit so the result type is always
        <code>T | undefined</code> rather than <code>T | null | undefined</code> —
        one absent-value to handle downstream instead of two. It's the same
        normalization reason APIs like <code>Array.find</code> return undefined.</div>
      </details>
      <details class="qa">
        <summary>A volume slider stores <code>0</code>, but playback always starts at 50. The code reads <code>settings.volume || 50</code>. Diagnose.</summary>
        <div><code>0</code> is falsy, so <code>||</code> discards the user's explicit
        0 and substitutes the default. Fix: <code>settings.volume ?? 50</code> —
        the fallback then applies only when volume was never set (null/undefined),
        not when it was set to a falsy-but-valid value. This is the canonical
        <code>||</code>-vs-<code>??</code> interview question.</div>
      </details>
      <details class="qa">
        <summary>In <code>obj?.a.b</code>, <code>obj</code> is non-null but <code>obj.a</code> is undefined. Crash or undefined?</summary>
        <div>Crash — <code>TypeError: Cannot read properties of undefined</code>.
        The <code>?.</code> guards only the value immediately before it
        (<code>obj</code>); once past that check, <code>.a.b</code> is ordinary
        access. Short-circuiting protects the <em>tail</em> from a nullish
        <em>head</em>, not every link from every other link. Guard each genuinely
        nullable link: <code>obj?.a?.b</code>.</div>
      </details>
      <details class="qa">
        <summary>When is <code>x!.y</code> defensible over <code>x?.y</code>?</summary>
        <div>When absence is a <em>programmer error</em> rather than a valid state —
        e.g. reading a map entry you inserted two lines earlier. There,
        <code>?.</code> would silently continue with undefined and move the failure
        somewhere mysterious, while <code>!</code> at least crashes at the true
        location. Better still is an explicit guard that throws a descriptive error.
        Rule: <code>?.</code> for "absence is normal", assertion/throw for "absence
        is a bug".</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>?.</code> reacts to nullish only, always yields <code>undefined</code> on short-circuit, and skips the whole chain tail — but each nullable link needs its own <code>?.</code>.</li>
        <li><code>??</code> falls back only on null/undefined; <code>||</code> also swallows <code>0</code>/<code>''</code>/<code>false</code> — a real bug class. Mixing them without parentheses is a syntax error.</li>
        <li><code>??=</code>/<code>||=</code>/<code>&amp;&amp;=</code> short-circuit the assignment itself — <code>??=</code> is lazy defaulting.</li>
        <li><code>!</code> (non-null and definite-assignment flavors) is a compile-time promise with no runtime check; required inputs and guards usually beat it.</li>
        <li>In templates, prefer one <code>&#64;if (…; as x)</code> narrow over repeating <code>?.</code> per binding.</li>
      </ul>

      <p><a routerLink="/what-is-angular">Next: What is Angular? →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Nullish {
  protected readonly profile = signal<Profile | null>(null);

  protected readonly falsyCases = FALSY_CASES;
  protected readonly picked = signal<FalsyCase>(FALSY_CASES[0]);

  protected orResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v || 'fallback') as unknown);
  }

  protected nullishResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v ?? 'fallback') as unknown);
  }

  protected full() {
    this.profile.set({ name: 'Ada', address: { city: 'London' } });
  }
  protected partial() {
    this.profile.set({ name: 'Ada' });
  }
  protected empty() {
    this.profile.set(null);
  }

  protected city(): string {
    return this.profile()?.address?.city ?? 'Unknown';
  }
}
