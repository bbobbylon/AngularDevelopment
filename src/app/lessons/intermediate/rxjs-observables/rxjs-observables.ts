import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, interval } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-lesson-rxjs-observables',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · RxJS</span>
      <h1>Observables</h1>
      <p class="lead">
        An Observable is a <strong>lazy stream of values that arrive over time</strong>.
        RxJS is the library that creates and transforms them, and Angular uses them
        everywhere — <code>HttpClient</code>, the router, a form's
        <code>valueChanges</code>, and more. This is one of the most important ideas in
        the whole framework, so we'll build the intuition carefully.
      </p>

      <h2>The mental model: a newsletter</h2>
      <p>
        Think of an Observable as a <strong>newsletter you can subscribe to</strong>.
        Nothing is sent until you subscribe. Once you do, you receive each new issue
        (a <em>value</em>) as it's published. The newsletter can eventually say "that's
        the last issue" (it <em>completes</em>), or hit a problem and shut down (an
        <em>error</em>). And you can <em>unsubscribe</em> at any time to stop receiving.
      </p>
      <p>
        Compare that to a <strong>Promise</strong>, which is like ordering one package:
        it arrives exactly once (or fails once), it already started before you "awaited"
        it, and you can't cancel it. An Observable is the more powerful, more general
        tool.
      </p>
      <table class="t">
        <tr><th></th><th>Promise</th><th>Observable</th></tr>
        <tr><td>How many values</td><td>exactly one</td><td>zero, one, or many over time</td></tr>
        <tr><td>Starts when</td><td>immediately (eager)</td><td>on <code>subscribe()</code> (lazy)</td></tr>
        <tr><td>Cancellable</td><td>no</td><td>yes — <code>unsubscribe()</code></td></tr>
        <tr><td>Transform with</td><td><code>.then()</code></td><td>100+ operators (map, filter, retry…)</td></tr>
      </table>

      <h2>Reading a marble diagram</h2>
      <p>
        RxJS people draw streams as <strong>marble diagrams</strong>. Time flows left to
        right; each marble is an emitted value; <code>|</code> means "completed" and
        <code>X</code> means "errored":
      </p>
      <div class="code">
        <pre>--1--2--3--4--|        a stream that emits 1,2,3,4 then completes
--a----b---c--|        values can arrive at any spacing
----------X            a stream that errors (and stops)
--1--2--                an infinite stream (never completes — e.g. clicks)</pre>
      </div>
      <p>You'll use this notation to reason about operators in the next lessons.</p>

      <h2>The Observer: next, error, complete</h2>
      <p>
        When you subscribe, you provide an <strong>observer</strong> — up to three
        callbacks describing how to react. This is the "contract" every Observable
        follows:
      </p>
      <div class="code">
        <pre>const sub = source$.subscribe({{ '{' }}
  next:     v =&gt; console.log('got a value:', v),   // 0..many times
  error:    e =&gt; console.error('failed:', e),       // at most ONCE, then done
  complete: () =&gt; console.log('no more values'),    // at most ONCE, then done
{{ '}' }});
sub.unsubscribe();   // stop early — you stop receiving values</pre>
      </div>
      <div class="note">
        The contract: <strong>next</strong> can fire any number of times, but
        <strong>error</strong> and <strong>complete</strong> are terminal — exactly one
        of them fires (or neither, for an infinite stream), and after it nothing more is
        emitted. A passing shorthand: <code>source$.subscribe(v =&gt; ...)</code> is just
        the <code>next</code> callback.
      </div>

      <h2>Creating an Observable</h2>
      <div class="code">
        <pre>const obs$ = new Observable&lt;number&gt;(subscriber =&gt; {{ '{' }}
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
  // optional teardown — runs on complete/error/unsubscribe:
  return () =&gt; console.log('cleaning up');
{{ '}' }});</pre>
      </div>
      <p>You rarely build one by hand though — RxJS ships creation helpers for the common cases:</p>
      <div class="code">
        <pre>of(1, 2, 3)            // emit fixed values, then complete
from([1, 2, 3])        // from an array / iterable / Promise
interval(1000)         // 0,1,2,… every second (infinite)
timer(500, 1000)       // wait 500ms, then emit every 1s
fromEvent(button, 'click')   // DOM events as a stream
EMPTY  /  NEVER  /  throwError(() =&gt; err)   // edge cases</pre>
      </div>

      <h2>Try it — subscribe / unsubscribe</h2>
      <div class="demo">
        <p class="demo__title">Live — interval(500) emits a counter while subscribed</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="start()" [disabled]="running()">Subscribe</button>
          <button class="ghost" (click)="stop()" [disabled]="!running()">Unsubscribe</button>
          <span class="pill">running: {{ running() }}</span>
        </div>
        <p>latest value: <strong style="font-size:1.2rem">{{ value() }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          The stream only runs while subscribed. Unsubscribe and the counter freezes —
          that's lazy, cancellable execution. Forgetting to unsubscribe from an infinite
          stream is the classic memory leak.
        </p>
      </div>

      <h2>Cold vs hot — a crucial distinction</h2>
      <p>
        Most Observables are <strong>cold &amp; unicast</strong>: the producer is created
        fresh <em>per subscriber</em>, so each <code>subscribe()</code> re-runs the work
        from the start. Two subscribers to an <code>http.get()</code> means <em>two</em>
        HTTP requests.
      </p>
      <p>
        <strong>Hot</strong> sources share one producer and <em>multicast</em> the same
        values to everyone — a <code>Subject</code> (next lesson) or
        <code>fromEvent</code> on a real DOM element. The operator
        <code>shareReplay()</code> turns a cold stream hot when you want many subscribers
        to share a single execution (e.g. one cached HTTP call).
      </p>

      <h2>Where Angular hands you Observables</h2>
      <div class="code">
        <pre>this.http.get&lt;User[]&gt;('/api/users')      // HTTP responses
this.route.paramMap                       // route parameters as they change
this.form.valueChanges                    // every edit to a reactive form
this.form.statusChanges                   // VALID / INVALID / PENDING over time
fromEvent(window, 'resize')               // any DOM event stream</pre>
      </div>
      <p>
        Because they're all Observables, the <em>same</em> operators and cleanup rules
        apply to every one of them — learn the pattern once, use it everywhere.

      </p>

      <div class="warn">
        <strong>Always clean up subscriptions</strong> to avoid memory leaks. Best
        options, in order: the <code>async</code> pipe (auto-unsubscribes in the
        template), <code>toSignal()</code>, or <code>takeUntilDestroyed()</code>. Manual
        <code>unsubscribe()</code> in <code>ngOnDestroy</code> works too. A stream that
        <code>complete()</code>s or errors tears itself down — but an infinite one
        (<code>interval</code>, <code>fromEvent</code>) leaks until you stop it.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>An Observable is a <strong>lazy</strong>, <strong>multi-value</strong>, <strong>cancellable</strong> stream over time — like a newsletter.</li>
        <li>Subscribe with an observer: <code>next</code> (0..many), then a terminal <code>error</code> <em>or</em> <code>complete</code>.</li>
        <li>Create with <code>of</code>, <code>from</code>, <code>interval</code>, <code>timer</code>, <code>fromEvent</code>; draw them as marble diagrams.</li>
        <li>Cold streams re-run per subscriber; hot streams multicast. <code>shareReplay</code> shares one run.</li>
        <li>Angular exposes HTTP, router, and forms as Observables — manage teardown with <code>async</code>/<code>toSignal</code>/<code>takeUntilDestroyed</code>.</li>
      </ul>

      <p><a routerLink="/rxjs-operators">Next: Core Operators →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
     .t td:first-child { width: 140px; color: var(--text-muted); }`,
  ],
})
export class RxjsObservables implements OnDestroy {
  protected readonly value = signal<number | string>('—');
  protected readonly running = signal(false);
  private sub?: Subscription;

  protected start() {
    if (this.running()) return;
    const counter$: Observable<number> = interval(500).pipe(take(1000));
    this.sub = counter$.subscribe((v) => this.value.set(v));
    this.running.set(true);
  }

  protected stop() {
    this.sub?.unsubscribe();
    this.running.set(false);
  }

  ngOnDestroy() {
    this.stop();
  }
}
