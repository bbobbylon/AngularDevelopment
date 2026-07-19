import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface User {
  name: string;
  role: 'admin' | 'member';
}

/**
 * Lesson: the built-in @if / @else if / @else control flow.
 *
 * Beyond the syntax: the `; as` alias and the truthiness trap it hides (a live
 * demo where `@if (count(); as c)` wrongly disappears at 0), what @if compiles
 * to and why a false branch destroys DOM + component state (a live "type, hide,
 * show" demo contrasting @if against [hidden]), the *ngIf → @if migration
 * including the then/else template-ref pattern that @if replaced, and the
 * pitfalls that show up in exams.
 */
@Component({
  selector: 'app-lesson-control-flow-if',
  imports: [RouterLink],
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .ok { color: var(--green); font-weight: 700; }
      .bad { color: #ef4444; font-weight: 700; }

      .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-top: 8px; }
      .split__box { border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; background: var(--bg-card); }
      .split__box h4 { margin: 0 0 8px; font-size: .82rem; }
      .split__box input { width: 100%; }
      .verdict { margin-top: 8px; font-size: .78rem; }

      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Control Flow: &#64;if / &#64;else</h1>
      <p class="lead">
        The built-in <code>&#64;if</code> block conditionally includes part of a
        template. It replaced the older <code>*ngIf</code> directive and needs no
        imports — it is part of the template <em>language</em>, compiled directly by
        Angular rather than resolved as a directive at runtime. This page goes from
        the syntax to the traps: the truthiness of <code>; as</code>, why a false
        branch throws away state, and how it maps from <code>*ngIf</code>.
      </p>

      <h2>&#64;if, &#64;else if, &#64;else</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <button (click)="logIn('admin')">Log in as admin</button>
          <button (click)="logIn('member')">Log in as member</button>
          <button class="ghost" (click)="user.set(null)">Log out</button>
        </div>

        @if (user(); as u) {
          <p>✅ Welcome back, <strong>{{ u.name }}</strong>.</p>
          @if (u.role === 'admin') {
            <p class="pill">You have admin privileges.</p>
          } @else {
            <p class="pill">Standard member access.</p>
          }
        } @else {
          <p>👋 Please log in to continue.</p>
        }
      </div>
      <div class="code"><pre>{{ basicSample }}</pre></div>
      <div class="note">
        The branches are checked top-to-bottom and exactly one wins — there is no
        fall-through. Only <code>&#64;if</code> can start the chain; <code>&#64;else if</code>
        and <code>&#64;else</code> must immediately follow it (no markup between the
        <code>&#125;</code> and the next <code>&#64;else</code>).
      </div>

      <h2>The <code>as</code> alias — and its truthiness trap</h2>
      <p>
        <code>&#64;if (expr; as name)</code> stores the condition's result in a local,
        read-only template variable so you can reuse it and narrow away
        <code>null</code>. The gotcha: the block shows only when <code>expr</code> is
        <strong>truthy</strong>, so a legitimate <code>0</code>, <code>''</code>, or
        <code>false</code> makes the whole block vanish. Watch it happen:
      </p>
      <div class="demo">
        <p class="demo__title">Live — step the count down to 0</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="count.update(c => c + 1)">+1</button>
          <button (click)="count.update(c => c - 1)">−1</button>
          <button class="ghost" (click)="count.set(0)">Set to 0</button>
          <span class="pill">count = {{ count() }}</span>
        </div>
        <div class="split">
          <div class="split__box">
            <h4><code>&#64;if (count(); as c)</code></h4>
            @if (count(); as c) {
              <div>Items: <strong>{{ c }}</strong></div>
            } @else {
              <div class="bad">— block hidden —</div>
            }
            <div class="verdict bad">disappears at 0 (0 is falsy)</div>
          </div>
          <div class="split__box">
            <h4><code>&#64;if (count() !== null)</code></h4>
            @if (count() !== null) {
              <div>Items: <strong>{{ count() }}</strong></div>
            } @else {
              <div>— block hidden —</div>
            }
            <div class="verdict ok">shows 0 correctly (explicit test)</div>
          </div>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Reach for <code>; as</code> to narrow an <em>object/nullable</em>. For a number
          or boolean, test explicitly (<code>count() !== null</code>,
          <code>flag() === true</code>) so a falsy-but-valid value still renders.
        </p>
      </div>
      <div class="tip">
        With the <code>async</code> pipe the alias earns its keep — unwrap the
        Observable once, narrow away <code>null</code>, and reuse the value:
        <div class="code" style="margin-top:8px"><pre>{{ asyncSample }}</pre></div>
      </div>

      <h2>A false branch is destroyed — state included</h2>
      <p>
        <code>&#64;if</code> compiles to an embedded view that is <em>created</em> when the
        condition becomes truthy and <em>destroyed</em> when it becomes falsy. Destroyed
        means gone: the DOM nodes, any component instances inside, their signals, and
        scroll/focus/uncontrolled-input state all reset next time the block reappears.
        That's different from hiding with CSS, where the element stays alive. Type into
        both boxes, hide, then show again:
      </p>
      <div class="demo">
        <p class="demo__title">Live — &#64;if vs [hidden]</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="showBoxes.update(v => !v)">
            {{ showBoxes() ? 'Hide' : 'Show' }} both
          </button>
          <span class="pill">{{ showBoxes() ? 'visible' : 'hidden' }}</span>
        </div>
        <div class="split">
          <div class="split__box">
            <h4><code>&#64;if</code> — element removed</h4>
            @if (showBoxes()) {
              <input placeholder="type, then hide + show" />
            }
            <div class="verdict bad">text is lost — the input was destroyed</div>
          </div>
          <div class="split__box">
            <h4><code>[hidden]</code> — element kept</h4>
            <input [hidden]="!showBoxes()" placeholder="type, then hide + show" />
            <div class="verdict ok">text survives — the input stayed in the DOM</div>
          </div>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Use <code>&#64;if</code> to genuinely add/remove work (don't render, don't
          subscribe, don't run a heavy child). Use <code>[hidden]</code> /
          <code>display:none</code> only for cheap, frequent toggles where you must
          preserve state.
        </p>
      </div>

      <h2>Coming from <code>*ngIf</code></h2>
      <p>
        <code>*ngIf</code> is the old structural directive; <code>&#64;if</code> is
        template syntax that replaces it. The most-missed detail in a migration is the
        <code>then</code>/<code>else</code> template-ref pattern — <code>&#64;if</code>
        folds those extra <code>&lt;ng-template&gt;</code>s into inline branches:
      </p>
      <div class="code"><pre>{{ migrationSample }}</pre></div>
      <table class="cmp">
        <tr><th></th><th><code>&#64;if</code> (modern)</th><th><code>*ngIf</code> (legacy)</th></tr>
        <tr><td>Import</td><td class="ok">none — built in</td><td><code>CommonModule</code> / <code>NgIf</code></td></tr>
        <tr><td>Else</td><td>inline <code>&#64;else</code> block</td><td><code>[ngIfElse]</code> + a <code>&lt;ng-template #ref&gt;</code></td></tr>
        <tr><td>Then</td><td>the block body</td><td><code>[ngIfThen]</code> template ref (swappable)</td></tr>
        <tr><td>Alias</td><td><code>; as x</code></td><td><code>; else e; let x</code> context</td></tr>
        <tr><td>Type narrowing</td><td class="ok">stronger — the compiler knows the branch</td><td>weaker in some cases</td></tr>
        <tr><td>Cost</td><td class="ok">no directive instance to instantiate</td><td>a directive per usage</td></tr>
      </table>
      <div class="tip">
        Migrate a whole project automatically with
        <code>ng generate &#64;angular/core:control-flow</code> — it rewrites
        <code>*ngIf</code>/<code>*ngFor</code>/<code>*ngSwitch</code> to the block syntax.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>The <code>; as</code> truthiness trap.</strong>
          <code>&#64;if (count(); as c)</code> hides on <code>0</code>/<code>''</code>/<code>false</code>.
          Test explicitly for value-types.</li>
        <li><strong>State loss on toggle.</strong> A false <code>&#64;if</code> destroys the
          subtree — form input, scroll position and child component state reset. Use
          <code>[hidden]</code> when that matters.</li>
        <li><strong>No bare <code>&#64;else</code>.</strong> <code>&#64;else</code> must
          attach to an <code>&#64;if</code>; there's no standalone else.</li>
        <li><strong>Markup between branches breaks the chain.</strong> Anything (even
          whitespace text nodes with content) between <code>&#125;</code> and
          <code>&#64;else</code> is a compile error.</li>
        <li><strong>Heavy work in both branches.</strong> Only the winning branch is
          instantiated — but a <code>&#64;defer</code> or expensive child in a branch that
          flips often re-pays its setup each time it returns.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why did my block vanish when the value is a valid <code>0</code>?</summary>
        <div><code>&#64;if (n(); as x)</code> renders only when <code>n()</code> is truthy, and
        <code>0</code> is falsy. Use an explicit condition like
        <code>&#64;if (n() !== null)</code> or <code>&#64;if (n() >= 0)</code>.</div>
      </details>
      <details class="qa">
        <summary>Does <code>&#64;if</code> hide the element or remove it?</summary>
        <div>Remove. It creates the embedded view when true and destroys it when false, so
        DOM nodes and any state inside are gone. CSS <code>display:none</code> /
        <code>[hidden]</code> keeps the element alive.</div>
      </details>
      <details class="qa">
        <summary>What replaces <code>*ngIf="x; else tpl"</code> with a <code>&lt;ng-template #tpl&gt;</code>?</summary>
        <div>An inline <code>&#64;else</code> block: <code>&#64;if (x) &#123; … &#125; &#64;else &#123; … &#125;</code>.
        No template reference variable needed.</div>
      </details>
      <details class="qa">
        <summary>Do you need to import anything to use <code>&#64;if</code>?</summary>
        <div>No. Built-in control flow is part of the template compiler — unlike
        <code>*ngIf</code>, which needed <code>CommonModule</code>/<code>NgIf</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;if</code> / <code>&#64;else if</code> / <code>&#64;else</code> handle conditionals — built into the template, no import.</li>
        <li><code>; as alias</code> captures and narrows the condition, but only when it's <strong>truthy</strong> — beware <code>0</code>/<code>''</code>/<code>false</code>.</li>
        <li>A false branch is <strong>destroyed</strong>: DOM and state reset. Use <code>[hidden]</code> to preserve state on cheap toggles.</li>
        <li>It replaces <code>*ngIf</code> with inline <code>&#64;else</code> (no then/else template refs) and stronger type narrowing.</li>
      </ul>

      <p><a routerLink="/control-flow-for">Next: Control Flow — &#64;for →</a></p>
    </article>
  `,
})
export class ControlFlowIf {
  protected readonly user = signal<User | null>(null);

  protected logIn(role: 'admin' | 'member') {
    this.user.set({ name: role === 'admin' ? 'Root' : 'Sam', role });
  }

  // --- truthiness-trap demo ---
  protected readonly count = signal(3);

  // --- destroy-vs-hidden demo ---
  protected readonly showBoxes = signal(true);

  // --- code samples (class properties so braces/backticks need no template escaping) ---
  protected readonly basicSample = `@if (user(); as u) {
  <p>Welcome, {{ u.name }}</p>
} @else if (loading()) {
  <p>Loading…</p>
} @else {
  <p>Please log in</p>
}`;

  protected readonly asyncSample = `@if (user$ | async; as user) {
  <h2>{{ user.name }}</h2>   <!-- unwrapped once, non-null here -->
}`;

  protected readonly migrationSample = `<!-- BEFORE — *ngIf with then/else template refs -->
<div *ngIf="user$ | async as user; else loading">{{ user.name }}</div>
<ng-template #loading><spinner /></ng-template>

<!-- AFTER — inline @else, no template references -->
@if (user$ | async; as user) {
  <div>{{ user.name }}</div>
} @else {
  <spinner />
}`;
}
