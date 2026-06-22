import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Status = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-lesson-control-flow-switch',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Control Flow: &#64;switch</h1>
      <p class="lead">
        <code>&#64;switch</code> renders exactly one branch based on a value —
        ideal for state machines like <em>idle / loading / success / error</em>.
        It is the template equivalent of a <code>switch</code> statement.
      </p>

      <h2>&#64;switch / &#64;case / &#64;default</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:16px">
          <button (click)="status.set('idle')">idle</button>
          <button (click)="status.set('loading')">loading</button>
          <button (click)="status.set('success')">success</button>
          <button (click)="status.set('error')">error</button>
        </div>

        <div class="panel">
          @switch (status()) {
            @case ('idle') {
              <p>💤 Nothing happening yet.</p>
            }
            @case ('loading') {
              <p>⏳ Loading your data…</p>
            }
            @case ('success') {
              <p>✅ Loaded successfully!</p>
            }
            @default {
              <p>❌ Something went wrong.</p>
            }
          }
        </div>
      </div>

      <div class="code">
        <pre>&#64;switch (status()) {{ '{' }}
  &#64;case ('loading') {{ '{' }} &lt;app-spinner /&gt; {{ '}' }}
  &#64;case ('success') {{ '{' }} &lt;app-results /&gt; {{ '}' }}
  &#64;default          {{ '{' }} &lt;app-error /&gt;   {{ '}' }}
{{ '}' }}</pre>
      </div>

      <div class="note">
        Matching uses strict equality (<code>===</code>). <code>&#64;default</code> is
        optional — if no case matches and there is no default, nothing renders.
        There is no fall-through and no <code>break</code> needed. A <code>&#64;case</code>
        takes any expression (<code>&#64;case (MAX)</code>), but you can't list several
        values in one case — give them separate <code>&#64;case</code> blocks. When you
        switch on a discriminated-union signal, Angular narrows the type inside each case.
      </div>
      <div class="warn">
        This replaces the old structural directive <code>*ngSwitch</code> /
        <code>*ngSwitchCase</code> / <code>*ngSwitchDefault</code>. The built-in block
        needs no <code>CommonModule</code> import and type-checks better; migrate with
        <code>ng generate &#64;angular/core:control-flow</code>.
      </div>

      <h2>Why not just chain &#64;if?</h2>
      <p>
        You could, but <code>&#64;switch</code> reads better for one-value-many-states
        logic and signals intent clearly. Reach for <code>&#64;if/&#64;else if</code>
        when the conditions are unrelated boolean expressions, and
        <code>&#64;switch</code> when you are comparing one value against several
        constants.
      </p>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;switch (value)</code> picks one <code>&#64;case</code> by strict equality.</li>
        <li><code>&#64;default</code> is the optional fallback branch.</li>
        <li>No <code>break</code>, no fall-through — only one branch renders.</li>
      </ul>

      <p><a routerLink="/let-block">Next: Local Template Variables — &#64;let →</a></p>
    </article>
  `,
  styles: [
    `
      .panel {
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg-elevated);
      }
      .panel p {
        margin: 0;
        font-size: 1.1rem;
      }
    `,
  ],
})
export class ControlFlowSwitch {
  protected readonly status = signal<Status>('idle');
}
