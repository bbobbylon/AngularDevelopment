import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, interval, map } from 'rxjs';

@Component({
  selector: 'app-lesson-rxjs-interop',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · RxJS</span>
      <h1>Signals ↔ RxJS Interop</h1>
      <p class="lead">
        Signals and Observables are not rivals — they solve different problems and
        coexist happily. <strong>Signals</strong> are the right tool for synchronous
        state you read in a template; <strong>Observables</strong> shine for events that
        arrive over time and async pipelines (debounce, retry, cancellation). The
        <code>&#64;angular/core/rxjs-interop</code> package gives you two bridges so you
        can convert at the boundary and use whichever fits each job.
      </p>

      <h2>Two bridges, two directions</h2>
      <div class="code">
        <pre>      Signals world                          Observables world
      ─────────────                          ─────────────────
        signal()  ──────toObservable()──────▶  Observable&lt;T&gt;
        Signal&lt;T&gt;  ◀──────toSignal()──────────  Observable&lt;T&gt;

  • toObservable: react to a signal with RxJS operators (debounce, switchMap…)
  • toSignal:     consume a stream as plain template-readable state (no async pipe)</pre>
      </div>

      <h2>toSignal — consume an Observable as a signal</h2>
      <div class="code">
        <pre>import {{ '{' }} toSignal {{ '}' }} from '&#64;angular/core/rxjs-interop';

// auto-subscribes AND auto-unsubscribes with the component
clock = toSignal(interval(1000), {{ '{' }} initialValue: 0 {{ '}' }});
// template: {{ '{{' }} clock() {{ '}}' }}</pre>
      </div>
      <p>
        <code>toSignal</code> replaces the <code>async</code> pipe in the class. It
        manages the subscription for you — no manual teardown.
      </p>
      <div class="note">
        Provide an <code>initialValue</code> (the signal is that value until the first
        emission), or pass <code>{{ '{' }} requireSync: true {{ '}' }}</code> when the
        source emits synchronously (like a <code>BehaviorSubject</code>) to get a
        non-undefined type immediately. If the Observable <strong>errors</strong>,
        reading the signal re-throws that error — handle it with
        <code>catchError</code> in the pipe. Call <code>toSignal</code> in an injection
        context (or pass an <code>injector</code>).
      </div>

      <h2>toObservable — expose a signal as a stream</h2>
      <div class="code">
        <pre>import {{ '{' }} toObservable {{ '}' }} from '&#64;angular/core/rxjs-interop';

query = signal('');
results$ = toObservable(this.query).pipe(
  debounceTime(300),
  switchMap(q =&gt; this.api.search(q)),
);</pre>
      </div>
      <p>
        This lets you apply RxJS operators (debounce, switchMap, retry) to a signal.
        Under the hood <code>toObservable</code> uses an <code>effect</code>, so it emits
        the signal's value whenever it changes — including the current value to a new
        subscriber.
      </p>

      <h2>Try it — the full round-trip</h2>
      <div class="demo">
        <p class="demo__title">Live — a signal → debounceTime(500) → back to a signal</p>
        <div class="row" style="margin-bottom:10px">
          <input
            [value]="query()"
            (input)="setQuery($any($event.target).value)"
            placeholder="Type quickly…"
            style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);min-width:240px"
          />
        </div>
        <p>typed — instant signal: <code>{{ query() || '—' }}</code></p>
        <p>
          debounced — signal&nbsp;←&nbsp;toSignal&nbsp;←&nbsp;debounceTime&nbsp;←&nbsp;toObservable&nbsp;←&nbsp;signal:
          <strong style="color:var(--green)">{{ debounced() || '—' }}</strong>
        </p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Type fast and the debounced value lags, settling 500ms after you stop. The
          value made a full trip out to RxJS and back — yet both ends are just signals
          your template reads. This is exactly the shape of a debounced search box.
        </p>
      </div>

      <h2>takeUntilDestroyed — automatic unsubscription</h2>
      <div class="code">
        <pre>constructor() {{ '{' }}
  interval(1000).pipe(
    takeUntilDestroyed()   // completes when the component is destroyed
  ).subscribe(...);
{{ '}' }}
// outside an injection context, pass a DestroyRef:
// .pipe(takeUntilDestroyed(this.destroyRef))</pre>
      </div>

      <h2>Try it — an Observable surfaced as a signal</h2>
      <div class="demo">
        <p class="demo__title">Live — toSignal turning interval(1000) into state</p>
        <p>tick = <strong style="font-size:1.3rem">{{ tick() }}</strong></p>
        <p>tick × 10 (computed off the signal) = <strong>{{ tickTimesTen() }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          The interval is an RxJS stream, but the template reads it like any signal —
          and it tears down automatically when you navigate away.
        </p>
      </div>

      <h2>When to use which</h2>
      <table class="t">
        <tr><td><strong>Signals</strong></td><td>Synchronous state, derived values, template reactivity.</td></tr>
        <tr><td><strong>Observables</strong></td><td>Async events over time, complex async pipelines (debounce, retry, cancellation).</td></tr>
      </table>

      <h2>Common mistakes</h2>
      <table class="t">
        <tr>
          <td><code>toSignal</code> outside an injection context</td>
          <td>Call it in a field initializer or constructor, or pass <code>{{ '{' }} injector {{ '}' }}</code> explicitly — otherwise it throws.</td>
        </tr>
        <tr>
          <td>Reading the signal before the first emit</td>
          <td>It's <code>undefined</code> until then. Provide <code>initialValue</code>, or <code>requireSync: true</code> for synchronous sources.</td>
        </tr>
        <tr>
          <td>Forgetting that errors re-throw on read</td>
          <td>An errored source makes <code>mySignal()</code> throw. Put <code>catchError</code> in the pipe <em>before</em> <code>toSignal</code>.</td>
        </tr>
        <tr>
          <td>Manual <code>.subscribe()</code> with no teardown</td>
          <td>Leaks after destroy. Add <code>takeUntilDestroyed()</code>, or prefer <code>toSignal</code> which cleans up for you.</td>
        </tr>
        <tr>
          <td>Bridging when you didn't need to</td>
          <td>If the data is plain synchronous state, just use a signal. Only reach for RxJS when you genuinely need operators over time.</td>
        </tr>
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>toSignal(obs$)</code> consumes an Observable as a signal (auto-managed).</li>
        <li><code>toObservable(sig)</code> exposes a signal as a stream for RxJS operators.</li>
        <li>Round-trip freely: a signal can go out to RxJS and come back a signal.</li>
        <li><code>takeUntilDestroyed()</code> auto-unsubscribes when the context is destroyed.</li>
        <li>Signals for state, RxJS for async orchestration — convert only at the boundary.</li>
      </ul>

      <p><a routerLink="/custom-pipes">Next: Custom Pipes →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 240px; }`,
  ],
})
export class RxjsInterop {
  // toSignal: an Observable consumed as a signal, auto-unsubscribed on destroy.
  protected readonly tick = toSignal(interval(1000).pipe(map((n) => n + 1)), {
    initialValue: 0,
  });

  protected readonly tickTimesTen = signal(0);

  // The full round-trip: a signal → toObservable → debounceTime → toSignal.
  protected readonly query = signal('');
  protected readonly debounced = toSignal(toObservable(this.query).pipe(debounceTime(500)), {
    initialValue: '',
  });

  constructor() {
    // Demonstrate toObservable + takeUntilDestroyed feeding another signal.
    const tick$ = toObservable(this.tick);
    tick$.pipe(takeUntilDestroyed()).subscribe((v) => this.tickTimesTen.set(v * 10));
  }

  protected setQuery(v: string): void {
    this.query.set(v);
  }
}
