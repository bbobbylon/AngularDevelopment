import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** An OnPush child — only re-checked when an input reference changes (or it emits). */
@Component({
  selector: 'app-onpush-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px">
      <strong>OnPush child</strong> · value: {{ value() }} ·
      <span style="color:var(--violet)">self-checks: {{ tick }}</span>
    </div>
  `,
})
export class OnpushChild {
  value = input(0);
  private n = 0;
  get tick() {
    return ++this.n;
  }
}

@Component({
  selector: 'app-lesson-onpush',
  imports: [RouterLink, OnpushChild],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>OnPush Change Detection</h1>
      <p class="lead">
        <code>ChangeDetectionStrategy.OnPush</code> tells Angular to skip a component
        during a CD pass <em>unless</em> something relevant changed: an
        <strong>input reference</strong>, an event fired from within it, an observable
        bound with <code>async</code> emitted, or a <strong>signal</strong> it reads
        changed. This prunes large parts of the tree and is the foundation of fast apps.
      </p>

      <h2>Opting in</h2>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  changeDetection: ChangeDetectionStrategy.OnPush,
  // …
{{ '}' }})</pre>
      </div>

      <h2>See the difference</h2>
      <div class="demo">
        <p class="demo__title">Live — watch the child's self-check counter</p>
        <app-onpush-child [value]="value()" />
        <div class="row" style="margin-top:12px">
          <button (click)="value.update((v) => v + 1)">Change child input (re-checks child)</button>
          <button class="ghost" (click)="poke()">Trigger parent CD only ({{ pokes() }})</button>
        </div>
        <p class="lead" style="font-size:.95rem">
          "Trigger parent CD only" runs a change detection pass but does
          <strong>not</strong> change the child's input — so the OnPush child is
          skipped and its counter holds. Changing the input re-checks it.
        </p>
      </div>

      <div class="tip">
        With <strong>signals</strong>, OnPush "just works": reading a signal in the
        template registers a dependency, and changing it marks exactly that view dirty.
        This is why new Angular code is effectively OnPush-by-default and heading toward
        <a routerLink="/zoneless">zoneless</a>.
      </div>
      <div class="warn">
        The classic OnPush bug: <strong>mutating</strong> an input object in place
        (<code>user.name = 'x'</code>) keeps the same reference, so the child never
        re-checks. Replace it (<code>{{ '{' }} ...user, name: 'x' {{ '}' }}</code>).
        Likewise a non-signal expression like <code>{{ '{{' }} Date.now() {{ '}}' }}</code>
        freezes under OnPush — the view only re-checks on input/event/signal changes.
      </div>

      <h2>The old escape hatches</h2>
      <div class="code">
        <pre>private cdr = inject(ChangeDetectorRef);
cdr.markForCheck();   // mark this view dirty for the next pass (e.g. after a manual mutation)
cdr.detectChanges();  // synchronously check this view now
// With immutable data + signals you rarely need these.</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>OnPush skips a subtree unless an input ref, event, async emission or signal changed.</li>
        <li>Treat inputs as <strong>immutable</strong> — replace objects/arrays, don't mutate.</li>
        <li>Signals integrate with OnPush automatically and dirty only the views that read them.</li>
        <li><code>markForCheck()</code> is the manual escape hatch — rarely needed with signals.</li>
      </ul>

      <p><a routerLink="/zoneless">Next: Zoneless Angular →</a></p>
    </article>
  `,
})
export class Onpush {
  protected readonly value = signal(0);
  protected readonly pokes = signal(0);

  protected poke() {
    this.pokes.update((p) => p + 1);
  }
}
