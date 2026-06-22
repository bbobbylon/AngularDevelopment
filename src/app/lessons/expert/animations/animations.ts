import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-animations',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Animations</h1>
      <p class="lead">
        Angular's animations API drives transitions from component state — entering and
        leaving the DOM, switching between named states, and staggering lists — using a
        declarative <code>trigger / state / transition / animate</code> vocabulary that
        runs on the Web Animations API.
      </p>

      <h2>Setup</h2>
      <div class="code">
        <pre>// app.config.ts
import {{ '{' }} provideAnimationsAsync {{ '}' }} from '&#64;angular/platform-browser/animations/async';
providers: [provideAnimationsAsync()]</pre>
      </div>

      <h2>Defining an animation</h2>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  animations: [
    trigger('openClose', [
      state('open',   style({{ '{' }} height: '*', opacity: 1 {{ '}' }})),
      state('closed', style({{ '{' }} height: '0', opacity: 0 {{ '}' }})),
      transition('open &lt;=&gt; closed', animate('200ms ease')),
    ]),
  ],
{{ '}' }})
// template: &lt;div [&#64;openClose]="isOpen ? 'open' : 'closed'"&gt;…&lt;/div&gt;</pre>
      </div>

      <h2>Enter / leave &amp; lists</h2>
      <div class="code">
        <pre>transition(':enter', [style({{ '{' }} opacity: 0 {{ '}' }}), animate('150ms')])   // element added
transition(':leave', [animate('150ms', style({{ '{' }} opacity: 0 {{ '}' }}))])  // element removed

// stagger a list:
transition('* =&gt; *', [
  query(':enter', [style({{ '{' }} opacity: 0 {{ '}' }}), stagger(60, animate('200ms'))], {{ '{' }} optional: true {{ '}' }}),
])</pre>
      </div>

      <h2>Try it — (CSS transition stand-in)</h2>
      <div class="demo">
        <p class="demo__title">Live — the concept, driven by a state toggle</p>
        <button (click)="open.set(!open())">{{ open() ? 'Collapse' : 'Expand' }}</button>
        <div
          [style.maxHeight]="open() ? '120px' : '0'"
          [style.opacity]="open() ? '1' : '0'"
          style="overflow:hidden;transition:max-height .25s ease, opacity .25s ease;margin-top:10px">
          <div style="padding:12px;border:1px solid var(--violet);border-radius:8px">
            This panel animates between two states. In real Angular animations the
            <code>[&#64;openClose]</code> trigger would drive this from the
            <code>open</code>/<code>closed</code> state.
          </div>
        </div>
      </div>

      <div class="tip">
        Use <code>provideAnimationsAsync()</code> to lazy-load the animations engine
        (smaller initial bundle). For many simple cases, plain CSS transitions/keyframes
        are lighter — reach for the Angular API when you need enter/leave hooks,
        state machines, or query/stagger orchestration.
      </div>
      <div class="note">
        <code>:enter</code>/<code>:leave</code> only fire when Angular actually adds or
        removes the element (via <code>&#64;if</code>/<code>&#64;for</code>/routing), so a
        plain hidden element won't animate. Disable animations during tests or for
        reduced-motion users by binding <code>[&#64;.disabled]="true"</code> on a host.
        Honor <code>prefers-reduced-motion</code> — gratuitous motion is an accessibility
        problem, not just a polish one.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Animations are declared with <code>trigger/state/transition/animate</code> and bound via <code>[&#64;name]</code>.</li>
        <li><code>:enter</code>/<code>:leave</code> animate elements added to or removed from the DOM.</li>
        <li><code>query</code> + <code>stagger</code> orchestrate list animations.</li>
        <li><code>provideAnimationsAsync()</code> keeps the engine out of the initial bundle.</li>
      </ul>

      <p><a routerLink="/view-transitions">Next: View Transitions →</a></p>
    </article>
  `,
})
export class Animations {
  protected readonly open = signal(true);
}
