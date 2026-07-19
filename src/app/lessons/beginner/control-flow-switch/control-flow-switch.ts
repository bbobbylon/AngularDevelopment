import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Status = 'idle' | 'loading' | 'success' | 'error';

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; height: number };

/**
 * Lesson: the built-in @switch / @case / @default control flow.
 *
 * Beyond the state-machine demo: how @switch differs from a chained @if (one
 * expression, strict === , exactly one branch), a live discriminated-union demo
 * showing per-case type narrowing, the object-identity and "no multi-value case"
 * traps, the *ngSwitch → @switch migration, and the exam questions people miss.
 */
@Component({
  selector: 'app-lesson-control-flow-switch',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Control Flow: &#64;switch</h1>
      <p class="lead">
        <code>&#64;switch</code> renders exactly one branch based on a single value —
        ideal for state machines like <em>idle / loading / success / error</em>. It is
        the template equivalent of a <code>switch</code> statement, but with no
        <code>break</code> and no fall-through: the matched <code>&#64;case</code> is the
        only one that renders.
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
            @case ('idle') { <p>💤 Nothing happening yet.</p> }
            @case ('loading') { <p>⏳ Loading your data…</p> }
            @case ('success') { <p>✅ Loaded successfully!</p> }
            @default { <p>❌ Something went wrong.</p> }
          }
        </div>
      </div>
      <div class="code"><pre>{{ basicSample }}</pre></div>
      <div class="note">
        Matching is strict equality (<code>===</code>). <code>&#64;default</code> is
        optional — if nothing matches and there's no default, the block renders nothing.
        The switch expression is evaluated <strong>once</strong> per change detection,
        then compared to each case; a chained <code>&#64;if</code> re-evaluates a fresh
        boolean at every rung.
      </div>

      <h2>Per-case type narrowing (the real superpower)</h2>
      <p>
        Switch on the discriminant of a tagged union and Angular narrows the type inside
        each <code>&#64;case</code> — so branch-specific fields are available and
        type-checked. Pair it with <code>&#64;let</code> to name the value once:
      </p>
      <div class="demo">
        <p class="demo__title">Live — one union, three shapes</p>
        <div class="row" style="margin-bottom:14px">
          <button (click)="shape.set({ kind: 'circle', radius: 5 })">circle</button>
          <button (click)="shape.set({ kind: 'square', side: 4 })">square</button>
          <button (click)="shape.set({ kind: 'triangle', base: 6, height: 3 })">triangle</button>
        </div>
        <div class="panel">
          @let s = shape();
          @switch (s.kind) {
            @case ('circle') {
              <p>⬤ Circle · radius <strong>{{ s.radius }}</strong> → area = π·r² = <strong>{{ area() }}</strong></p>
            }
            @case ('square') {
              <p>◼ Square · side <strong>{{ s.side }}</strong> → area = s² = <strong>{{ area() }}</strong></p>
            }
            @case ('triangle') {
              <p>▲ Triangle · {{ s.base }}×{{ s.height }} → area = ½·b·h = <strong>{{ area() }}</strong></p>
            }
          }
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Inside <code>&#64;case ('circle')</code>, <code>s.radius</code> compiles;
          <code>s.side</code> would <em>not</em> — the compiler knows <code>s</code> is
          the circle variant there. That's the same narrowing a TypeScript
          <code>switch (s.kind)</code> gives you, now in the template.
        </p>
      </div>

      <h2>When to use &#64;switch vs a chain of &#64;if</h2>
      <table class="cmp">
        <tr><th></th><th><code>&#64;switch</code></th><th>chained <code>&#64;if / &#64;else if</code></th></tr>
        <tr><td>Shape of the test</td><td>one value vs several constants</td><td>unrelated boolean expressions</td></tr>
        <tr><td>Evaluation</td><td>expression once, then <code>===</code> per case</td><td>a new condition evaluated per rung</td></tr>
        <tr><td>Type narrowing</td><td class="ok">narrows the discriminant per case</td><td>narrows only what each condition proves</td></tr>
        <tr><td>Reads best for</td><td>state machines, enums, union tags</td><td>ranges, combined conditions, feature flags</td></tr>
      </table>

      <h2>Coming from <code>*ngSwitch</code></h2>
      <p>
        <code>&#64;switch</code> replaces the three-directive combo
        <code>*ngSwitch</code> / <code>*ngSwitchCase</code> / <code>*ngSwitchDefault</code>
        — and fixes a notorious footgun: the old <code>*ngSwitchCase</code> used
        <em>loose</em> equality via attribute binding, so numbers-as-strings quietly
        matched. The block form is strict and needs no import:
      </p>
      <div class="code"><pre>{{ migrationSample }}</pre></div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Strict <code>===</code>, including for objects.</strong>
          <code>&#64;case (someObj)</code> matches only the <em>same reference</em>, never a
          structurally-equal one. Switch on a primitive discriminant (a string/number
          tag), not an object.</li>
        <li><strong>No multi-value case.</strong> You can't write
          <code>&#64;case ('a', 'b')</code> or stack labels. Give each value its own
          <code>&#64;case</code>, or fold the rest into <code>&#64;default</code>.</li>
        <li><strong>No fall-through.</strong> Exactly one branch runs — there's no
          <code>break</code> and no cascading, unlike a JS <code>switch</code>.</li>
        <li><strong>Silent empty render.</strong> No matching case and no
          <code>&#64;default</code> = nothing shown. Add a <code>&#64;default</code> if
          "unknown state" should be visible.</li>
        <li><strong>Number vs string cases.</strong> <code>&#64;case (1)</code> won't match
          the string <code>'1'</code>. Keep the switch value and the case literals the
          same type.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Does a <code>&#64;case</code> need a <code>break</code>?</summary>
        <div>No. There's no fall-through, so no <code>break</code>. Only the first strictly
        matching case renders.</div>
      </details>
      <details class="qa">
        <summary>Nothing renders and there's no error — why?</summary>
        <div>No case matched and there's no <code>&#64;default</code>. Either the value's
        type/spelling differs from the case literals, or you need a default branch.</div>
      </details>
      <details class="qa">
        <summary>How do I access variant-specific fields safely inside a case?</summary>
        <div>Switch on the union's discriminant (<code>&#64;switch (s.kind)</code>). Angular
        narrows <code>s</code> to that variant inside each <code>&#64;case</code>, so the
        branch's fields type-check.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;switch (value)</code> picks one <code>&#64;case</code> by strict equality; <code>&#64;default</code> is the optional fallback.</li>
        <li>No <code>break</code>, no fall-through, no multi-value case — one branch renders.</li>
        <li>Switching on a union discriminant narrows the type inside each case.</li>
        <li>Reach for <code>&#64;switch</code> for one-value-many-states; use a <code>&#64;if</code> chain for unrelated booleans.</li>
      </ul>

      <p><a routerLink="/let-block">Next: Local Template Variables — &#64;let →</a></p>
    </article>
  `,
  styles: [
    `
      .panel { padding: 18px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-elevated); }
      .panel p { margin: 0; font-size: 1.05rem; }
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .ok { color: var(--green); font-weight: 700; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class ControlFlowSwitch {
  protected readonly status = signal<Status>('idle');

  // --- discriminated-union narrowing demo ---
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });
  protected readonly area = computed(() => {
    const s = this.shape();
    switch (s.kind) {
      case 'circle':
        return +(Math.PI * s.radius ** 2).toFixed(2);
      case 'square':
        return s.side ** 2;
      case 'triangle':
        return (s.base * s.height) / 2;
    }
  });

  protected readonly basicSample = `@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('success') { <app-results /> }
  @default          { <app-error />   }
}`;

  protected readonly migrationSample = `<!-- BEFORE — three cooperating directives, needs CommonModule -->
<div [ngSwitch]="status">
  <app-spinner *ngSwitchCase="'loading'" />
  <app-results *ngSwitchCase="'success'" />
  <app-error   *ngSwitchDefault />
</div>

<!-- AFTER — built-in, strict ===, no import -->
@switch (status) {
  @case ('loading') { <app-spinner /> }
  @case ('success') { <app-results /> }
  @default          { <app-error /> }
}`;
}
