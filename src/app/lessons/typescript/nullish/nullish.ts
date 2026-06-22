import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Profile {
  name: string;
  address?: { city?: string };
  prefs?: { theme?: string };
}

@Component({
  selector: 'app-lesson-ts-nullish',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Optional Chaining & Nullish Coalescing</h1>
      <p class="lead">
        These operators make working with possibly-missing values safe and concise —
        and they work the same way inside Angular templates.
      </p>

      <h2>Optional chaining <code>?.</code></h2>
      <p>Short-circuits to <code>undefined</code> if anything before it is null/undefined:</p>
      <div class="code">
        <pre>user?.address?.city          // undefined instead of a crash
user?.greet?.()              // call only if greet exists
list?.[0]                    // safe index access</pre>
      </div>

      <h2>Nullish coalescing <code>??</code></h2>
      <p>
        Returns the right side only when the left is <code>null</code> or
        <code>undefined</code> — unlike <code>||</code>, it does <strong>not</strong>
        treat <code>0</code>, <code>''</code> or <code>false</code> as "empty":
      </p>
      <div class="code">
        <pre>const count = input ?? 0;     // 0 only when input is null/undefined
0 || 5      // → 5  ❌ (0 is falsy)
0 ?? 5      // → 0  ✅
'' ?? 'x'   // → '' ✅</pre>
      </div>

      <p>
        Optional chaining <strong>short-circuits the whole chain</strong>: if
        <code>user</code> is nullish, nothing to the right is evaluated (no method calls,
        no index reads) and the expression is <code>undefined</code>.
      </p>

      <h2>Combine them</h2>
      <div class="code">
        <pre>const city = user?.address?.city ?? 'Unknown';
const theme = profile?.prefs?.theme ?? 'dark';</pre>
      </div>
      <div class="warn">
        You can't mix <code>??</code> with <code>||</code> or <code>&amp;&amp;</code> without
        parentheses — <code>a ?? b || c</code> is a <strong>syntax error</strong>. Be
        explicit: <code>(a ?? b) || c</code>.
      </div>

      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="full()">full profile</button>
          <button (click)="partial()">missing address</button>
          <button (click)="empty()">empty</button>
        </div>
        <p><code>city = profile?.address?.city ?? 'Unknown'</code></p>
        <p>→ <strong>{{ city() }}</strong></p>
      </div>

      <h2>Nullish assignment <code>??=</code></h2>
      <div class="code">
        <pre>options.timeout ??= 3000;   // set only if currently null/undefined</pre>
      </div>

      <h2>Non-null assertion <code>!</code></h2>
      <div class="code">
        <pre>const el = document.querySelector('#app')!;   // "trust me, not null"</pre>
      </div>
      <div class="warn">
        <code>!</code> silences the compiler but does <strong>not</strong> add a
        runtime check — if you are wrong it still crashes. Prefer a real guard or
        <code>?.</code>/<code>??</code>. In Angular components, signal/required inputs
        usually remove the need for <code>!</code>.
      </div>

      <h2>In templates</h2>
      <div class="code">
        <pre>&lt;p&gt;{{ '{{' }} user()?.address?.city ?? 'n/a' {{ '}}' }}&lt;/p&gt;</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>?.</code> safely accesses/calls through possibly-missing values.</li>
        <li><code>??</code> falls back only on null/undefined (keeps <code>0</code>/<code>''</code>/<code>false</code>).</li>
        <li><code>??=</code> assigns only when currently nullish.</li>
        <li><code>!</code> is a compile-time assertion with no runtime safety — use sparingly.</li>
      </ul>

      <p><a routerLink="/what-is-angular">Next: What is Angular? →</a></p>
    </article>
  `,
})
export class Nullish {
  protected readonly profile = signal<Profile | null>(null);

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
