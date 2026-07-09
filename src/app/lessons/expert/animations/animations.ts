import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Angular animations in 2026 — the landscape shifted. The classic
 * @angular/animations package (trigger/state/transition) is DEPRECATED; the
 * modern path is native CSS transitions/keyframes plus the built-in
 * animate.enter / animate.leave bindings for DOM add/remove. This page
 * teaches the modern approach live (enter/leave, state toggles, staggered
 * lists), maps the legacy API onto it (you WILL meet trigger() in older
 * codebases and exams), and covers performance + reduced-motion discipline.
 */
@Component({
  selector: 'app-lesson-animations',
  imports: [RouterLink],
  styles: [`
    /* --- enter/leave demo --- */
    .toast { padding: 10px 16px; border: 1px solid var(--green); border-radius: 10px; margin-top: 10px; background: rgba(16,185,129,.08); }
    .fade-slide-in { animation: fade-slide-in .3s ease; }
    .fade-slide-out { animation: fade-slide-out .25s ease forwards; }
    @keyframes fade-slide-in { from { opacity: 0; transform: translateY(8px); } }
    @keyframes fade-slide-out { to { opacity: 0; transform: translateY(-8px); } }

    /* --- state-toggle demo --- */
    .panel { overflow: hidden; transition: grid-template-rows .3s ease, opacity .3s ease; display: grid; grid-template-rows: 1fr; opacity: 1; }
    .panel.closed { grid-template-rows: 0fr; opacity: 0; }
    .panel > div { min-height: 0; }

    /* --- stagger demo --- */
    .stagger-item { animation: fade-slide-in .35s ease backwards; padding: 8px 14px; border: 1px solid var(--border); border-radius: 8px; margin: 6px 0; background: var(--bg-card); }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }
    .ok { color: var(--green); font-weight: 700; }
    .bad { color: #ef4444; font-weight: 700; }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }

    @media (prefers-reduced-motion: reduce) {
      .fade-slide-in, .fade-slide-out, .stagger-item { animation: none; }
      .panel { transition: none; }
    }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Animations</h1>
      <p class="lead">
        The animations story changed recently, and knowing that <em>is</em> the expert
        signal: the classic <code>&#64;angular/animations</code> package
        (<code>trigger/state/transition</code>) is <strong>deprecated</strong>. Modern
        Angular animates with native CSS — plus two small framework hooks,
        <code>animate.enter</code> and <code>animate.leave</code>, that solve the one
        thing CSS can't do alone: animating elements <em>out</em> of the DOM.
      </p>

      <h2>The one hard problem: leave animations</h2>
      <p>
        CSS handles entering easily (the element appears with an animation class). But
        when <code>&#64;if</code> turns false, Angular removes the element
        <em>immediately</em> — there's nothing left to animate.
        <code>animate.leave</code> fixes this: Angular applies your class, <strong>waits
        for the animation/transition to finish, then removes the node</strong>:
      </p>
      <div class="code"><pre>{{ enterLeaveSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — enter &amp; leave, pure CSS + two bindings</p>
        <button (click)="showToast.set(!showToast())">{{ showToast() ? 'Dismiss' : 'Show' }} toast</button>
        @if (showToast()) {
          <div class="toast" animate.enter="fade-slide-in" animate.leave="fade-slide-out">
            ✓ Saved successfully — watch me leave gracefully too
          </div>
        }
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Dismiss it: the element plays <code>fade-slide-out</code> to completion
          <em>before</em> the DOM removal. Without <code>animate.leave</code> it would
          vanish on the spot.
        </p>
      </div>

      <h2>State-driven animation = class binding + CSS transition</h2>
      <p>
        The old <code>state('open') / state('closed')</code> machinery is, in modern
        terms, a class binding and a transition. This demo animates height correctly —
        the classic "you can't transition to <code>height: auto</code>" problem —
        using the <code>grid-template-rows: 0fr → 1fr</code> technique:
      </p>
      <div class="code"><pre>{{ stateSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — open/close driven by a signal</p>
        <button (click)="open.set(!open())">{{ open() ? 'Collapse' : 'Expand' }}</button>
        <div class="panel" [class.closed]="!open()" style="margin-top:10px">
          <div>
            <div style="padding:12px;border:1px solid var(--accent);border-radius:8px">
              State lives in a signal, the template binds a class, CSS owns the motion.
              Three technologies each doing the one thing they're best at.
            </div>
          </div>
        </div>
      </div>

      <h2>Staggered lists — animation-delay by index</h2>
      <div class="code"><pre>{{ staggerSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — each item delays by its index</p>
        <button (click)="reshuffle()">Load list again</button>
        @for (item of items(); track trackKey($index)) {
          <div class="stagger-item" [style.animation-delay.ms]="$index * 70">{{ item }}</div>
        }
      </div>
      <p style="color:var(--text-muted);font-size:.85rem">
        <code>animation-fill-mode: backwards</code> (the <code>backwards</code> keyword
        in the shorthand) keeps each item invisible until its delayed animation starts —
        without it, delayed items flash at full opacity first.
      </p>

      <h2>The legacy API — you'll still meet it</h2>
      <p>
        Years of codebases (and exam questions) use <code>&#64;angular/animations</code>.
        Read it fluently, map it mentally, and don't start new work with it:
      </p>
      <div class="code"><pre>{{ legacySample }}</pre></div>
      <table class="cmp">
        <tr><th>Legacy (&#64;angular/animations)</th><th>Modern equivalent</th></tr>
        <tr><td><code>transition(':enter', …)</code></td><td><code>animate.enter="css-class"</code></td></tr>
        <tr><td><code>transition(':leave', …)</code></td><td><code>animate.leave="css-class"</code> (framework delays removal)</td></tr>
        <tr><td><code>state() + transition('a &lt;=&gt; b')</code></td><td>class binding + CSS <code>transition</code></td></tr>
        <tr><td><code>query() + stagger()</code></td><td><code>[style.animation-delay]</code> per index</td></tr>
        <tr><td><code>keyframes()</code></td><td>CSS <code>&#64;keyframes</code></td></tr>
        <tr><td><code>(&#64;trigger.done)</code> callback</td><td><code>(animationend)</code> / <code>(transitionend)</code> events</td></tr>
        <tr><td>route transitions via <code>&#64;routeAnimations</code></td><td>the router's <a routerLink="/view-transitions">View Transitions</a> (<code>withViewTransitions()</code>)</td></tr>
        <tr><td><code>provideAnimationsAsync()</code></td><td>not needed at all — CSS ships free</td></tr>
      </table>
      <div class="note">
        Migration honesty: the legacy engine still works and won't break tomorrow — the
        deprecation means no new investment. Migrate opportunistically (when touching a
        component), replace <code>&#64;routeAnimations</code> choreography with view
        transitions, and delete <code>provideAnimationsAsync()</code> once nothing legacy
        remains — the engine is bundle weight the modern approach doesn't pay.
      </div>

      <h2>Performance — animate on the compositor</h2>
      <table class="cmp">
        <tr><th>Property</th><th></th><th>Why</th></tr>
        <tr><td><code>transform</code>, <code>opacity</code></td><td class="ok">cheap</td><td>composited on the GPU — no layout, no paint, off the main thread</td></tr>
        <tr><td><code>filter</code>, <code>clip-path</code></td><td class="ok">usually fine</td><td>paint-only on modern engines</td></tr>
        <tr><td><code>height</code>, <code>width</code>, <code>top/left</code>, <code>margin</code></td><td class="bad">expensive</td><td>trigger layout for the element AND everything it pushes — jank on weak devices</td></tr>
        <tr><td><code>box-shadow</code> (animated)</td><td class="bad">expensive</td><td>large repaints every frame — animate the opacity of a pseudo-element's shadow instead</td></tr>
      </table>
      <p>
        The professional trick for "move from A to B" layout changes is
        <strong>FLIP</strong>: measure First and Last positions, apply the Inverted delta
        as a transform, then Play the transform back to zero — layout math once, motion
        entirely on the compositor. (The browser's View Transitions API automates
        exactly this.)
      </p>

      <h2>Reduced motion is a requirement, not polish</h2>
      <div class="code"><pre>{{ reducedMotionSample }}</pre></div>
      <p>
        Vestibular disorders make large sliding/zooming motion physically unpleasant.
        Honor the OS-level setting: keep opacity fades if you like, kill movement. This
        very page's demo styles include the media query above — enable "reduce motion"
        in your OS and the demos go static.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does removing an element skip its CSS animation, and what fixes it?</summary>
        <div>When <code>&#64;if</code>/<code>&#64;for</code> removes a node, it leaves the DOM
        immediately — CSS can't animate what isn't there. <code>animate.leave="cls"</code>
        makes Angular apply the class and defer the removal until the
        animation/transition completes.</div>
      </details>
      <details class="qa">
        <summary>What's the status of <code>&#64;angular/animations</code>?</summary>
        <div>Deprecated. Existing code keeps working, but the guidance is native CSS +
        <code>animate.enter</code>/<code>animate.leave</code>, with the router's view
        transitions replacing route-change choreography. New code shouldn't add
        <code>trigger()</code>-based animations or <code>provideAnimationsAsync()</code>.</div>
      </details>
      <details class="qa">
        <summary>An accordion animates <code>height</code> and stutters on mobile. Fixes?</summary>
        <div>Height animation runs layout every frame. Use the
        <code>grid-template-rows: 0fr→1fr</code> technique, transform-based motion, or
        FLIP. If it must be height, at least contain the layout scope
        (<code>contain: layout</code>).</div>
      </details>
      <details class="qa">
        <summary>How do you stagger a list without the legacy <code>stagger()</code>?</summary>
        <div>Bind the delay per index — <code>[style.animation-delay.ms]="$index * 70"</code>
        — with <code>animation-fill-mode: backwards</code> so items don't flash before
        their turn.</div>
      </details>
      <details class="qa">
        <summary>How do animations affect tests, and what's the modern answer?</summary>
        <div>The legacy engine needed <code>provideNoopAnimations()</code> so tests didn't
        wait on transitions. CSS animations don't run meaningfully in JSDOM-style test
        environments at all — one more reason the modern approach simplifies testing.
        E2E tools (Playwright) can force <code>prefers-reduced-motion</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Modern Angular animation = CSS transitions/keyframes + class bindings; the framework only intervenes for enter/leave.</li>
        <li><code>animate.leave</code> delays DOM removal until the exit animation finishes — the one genuinely hard problem, solved in one attribute.</li>
        <li><code>&#64;angular/animations</code> is deprecated: read it, map it, migrate opportunistically.</li>
        <li>Animate <code>transform</code>/<code>opacity</code>; never layout properties on hot paths; FLIP for layout moves.</li>
        <li><code>prefers-reduced-motion</code> support is an accessibility requirement.</li>
      </ul>

      <p><a routerLink="/view-transitions">Next: View Transitions →</a></p>
    </article>
  `,
})
export class Animations {
  protected readonly showToast = signal(false);
  protected readonly open = signal(true);

  // --- stagger demo: change the tracking keys so @for re-creates (and re-animates) items ---
  private readonly generation = signal(0);
  private readonly baseItems = ['Signals', 'RxJS interop', 'Control flow', 'Deferred views', 'Hydration'];
  readonly items = computed(() => {
    void this.generation();
    return this.baseItems;
  });
  trackKey(index: number): string {
    return `${this.generation()}-${index}`;
  }
  reshuffle() {
    this.generation.update((g) => g + 1);
  }

  // --- code samples ---
  readonly enterLeaveSample = `<!-- classes defined in plain CSS -->
@if (saved()) {
  <div class="toast"
       animate.enter="fade-slide-in"
       animate.leave="fade-slide-out">
    Saved!
  </div>
}

/* component or global stylesheet */
.fade-slide-in  { animation: fade-slide-in .3s ease; }
.fade-slide-out { animation: fade-slide-out .25s ease forwards; }
@keyframes fade-slide-in  { from { opacity: 0; transform: translateY(8px); } }
@keyframes fade-slide-out { to   { opacity: 0; transform: translateY(-8px); } }`;

  readonly stateSample = `<!-- template: state is just a class -->
<div class="panel" [class.closed]="!open()">
  <div> …content… </div>
</div>

/* the 0fr→1fr grid trick transitions "height: auto" correctly */
.panel        { display: grid; grid-template-rows: 1fr; opacity: 1;
                transition: grid-template-rows .3s ease, opacity .3s ease; }
.panel.closed { grid-template-rows: 0fr; opacity: 0; }
.panel > div  { min-height: 0; overflow: hidden; }`;

  readonly staggerSample = `@for (item of items(); track item.id) {
  <div class="stagger-item" [style.animation-delay.ms]="$index * 70">
    {{ item.name }}
  </div>
}

/* 'backwards' keeps delayed items hidden until their animation begins */
.stagger-item { animation: fade-slide-in .35s ease backwards; }`;

  readonly legacySample = `// DEPRECATED vocabulary — for reading existing code
import { trigger, state, style, transition, animate, query, stagger }
  from '@angular/animations';

@Component({
  animations: [
    trigger('openClose', [
      state('open',   style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0', opacity: 0 })),
      transition('open <=> closed', animate('200ms ease')),
    ]),
    trigger('list', [
      transition('* => *', [
        query(':enter',
          [style({ opacity: 0 }), stagger(60, animate('200ms'))],
          { optional: true }),
      ]),
    ]),
  ],
})
// <div [@openClose]="isOpen ? 'open' : 'closed'" (@openClose.done)="…">
// required: provideAnimationsAsync() in app.config.ts`;

  readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  .fade-slide-in, .fade-slide-out, .stagger-item { animation: none; }
  .panel { transition: none; }
}

/* or flip the default: define motion ONLY for users who allow it */
@media (prefers-reduced-motion: no-preference) {
  .toast { animation: fade-slide-in .3s ease; }
}`;
}
