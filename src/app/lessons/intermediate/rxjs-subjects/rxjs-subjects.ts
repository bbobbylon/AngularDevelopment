import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, ReplaySubject, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-lesson-rxjs-subjects',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · RxJS</span>
      <h1>Subjects</h1>
      <p class="lead">
        A regular Observable is a <em>cold</em> producer — each subscriber gets its own
        private run. A <strong>Subject</strong> is different: it's both an Observable
        <em>and</em> an Observer. You can <code>next()</code> values <em>into</em> it, and
        it <strong>multicasts</strong> them to every subscriber at once. That makes it the
        classic building block for event buses and shared state.
      </p>

      <h2>Observable vs Subject in one picture</h2>
      <div class="code">
        <pre>Cold Observable — each subscriber gets a fresh, independent run:
  subA: --1--2--3--|
  subB:    --1--2--3--|    (its OWN run, started when it subscribed)

Subject — ONE run, the same values pushed to everyone (multicast):
  you:  --A--B-----C--      (you call .next('A'), .next('B'), …)
  subA: --A--B-----C--
  subB: -----B-----C--      (joined after A, so only sees B and C onward)</pre>
      </div>

      <h2>The four flavors</h2>
      <table class="t">
        <tr><td><code>Subject</code></td><td>No memory. Subscribers only get values emitted <em>after</em> they subscribe.</td></tr>
        <tr><td><code>BehaviorSubject</code></td><td>Holds a <strong>current value</strong>; new subscribers immediately get the latest. <strong>Ideal for state.</strong></td></tr>
        <tr><td><code>ReplaySubject</code></td><td>Replays the last <em>N</em> values to new subscribers.</td></tr>
        <tr><td><code>AsyncSubject</code></td><td>Emits only the <em>final</em> value, and only once it completes.</td></tr>
      </table>

      <div class="code">
        <pre>The difference is what a LATE subscriber sees (joins after 1,2,3 emitted):

Subject:           late sub → (nothing until the next emission)
BehaviorSubject(0):late sub → 3            (the current value, immediately)
ReplaySubject(2):  late sub → 2, 3          (the last two, immediately)
AsyncSubject:      late sub → (nothing until complete, then the last value)</pre>
      </div>

      <h2>BehaviorSubject for shared state</h2>
      <div class="code">
        <pre>private count$ = new BehaviorSubject&lt;number&gt;(0);
readonly count = this.count$.asObservable();   // expose READ-ONLY

increment() {{ '{' }} this.count$.next(this.count$.value + 1); {{ '}' }}
//                                  ^ .value reads the current value synchronously</pre>
      </div>

      <h2>Try it — multicast to two subscribers</h2>
      <div class="demo">
        <p class="demo__title">Live — a BehaviorSubject pushing to two subscribers</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="emit()">Emit next value</button>
          <button class="ghost" (click)="lateSubscribe()" [disabled]="lateJoined()">
            Add a late subscriber
          </button>
        </div>
        <p>BehaviorSubject current value: <strong>{{ current() }}</strong></p>
        <p>Subscriber A (joined at start) saw: <code>{{ a().join(', ') || '—' }}</code></p>
        <p>Subscriber B (joined late) saw: <code>{{ b().join(', ') || '— not joined' }}</code></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Emit a few values, then add the late subscriber — B immediately receives the
          <em>current</em> value on joining. That's the BehaviorSubject difference; a
          plain Subject would give B nothing until the next emit.
        </p>
      </div>

      <h2>The event-bus pattern</h2>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class NotificationBus {{ '{' }}
  private events$ = new Subject&lt;string&gt;();
  readonly messages = this.events$.asObservable();   // others subscribe to this
  notify(msg: string) {{ '{' }} this.events$.next(msg); {{ '}' }}     // anyone can publish
{{ '}' }}</pre>
      </div>
      <p>Unrelated components can communicate without knowing about each other — one publishes, others subscribe.</p>

      <div class="warn">
        A Subject is <strong>hot &amp; multicast</strong>, and once it
        <code>complete()</code>s or errors it is <strong>terminated</strong> — further
        <code>next()</code> calls are ignored, and a new subscriber to a completed Subject
        gets only the completion. Never expose the raw Subject; return
        <code>.asObservable()</code> so consumers can't push or complete it.
      </div>

      <div class="note">
        In modern Angular, a <strong>signal</strong> often replaces a
        <code>BehaviorSubject</code> for component/service state — it's simpler, has no
        subscription to manage, and integrates with change detection. Reach for a Subject
        when you specifically need an <em>event stream</em> you can pipe RxJS operators
        through (debounce a search box, buffer clicks, etc.).
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>A Subject is an Observable you can also push into; it <strong>multicasts</strong> to all subscribers.</li>
        <li><code>BehaviorSubject</code> holds a current value (great for state); <code>ReplaySubject</code> replays history.</li>
        <li>A late subscriber's experience differs per flavor — that's the whole point of the four.</li>
        <li>Expose <code>.asObservable()</code> to keep <code>next()</code> private; prefer signals for plain state.</li>
      </ul>

      <p><a routerLink="/rxjs-interop">Next: Signals ↔ RxJS Interop →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; white-space: nowrap; }`,
  ],
})
export class RxjsSubjects implements OnDestroy {
  private readonly value$ = new BehaviorSubject<number>(0);
  protected readonly current = signal(0);
  protected readonly a = signal<number[]>([]);
  protected readonly b = signal<number[]>([]);
  protected readonly lateJoined = signal(false);

  private subs = new Subscription();

  constructor() {
    // Subscriber A joins immediately.
    this.subs.add(this.value$.subscribe((v) => this.a.update((arr) => [...arr, v])));
    this.subs.add(this.value$.subscribe((v) => this.current.set(v)));
    // Keep references to the other Subject types so they are demonstrated/imported.
    void new Subject<void>();
    void new ReplaySubject<number>(2);
  }

  protected emit() {
    this.value$.next(this.value$.value + 1);
  }

  protected lateSubscribe() {
    this.lateJoined.set(true);
    this.subs.add(this.value$.subscribe((v) => this.b.update((arr) => [...arr, v])));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
