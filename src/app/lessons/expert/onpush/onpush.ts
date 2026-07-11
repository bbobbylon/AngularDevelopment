import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injectable,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: OnPush change detection — what actually marks a view dirty, live
 * proof of the skip, the mutation trap, markForCheck vs detectChanges, and
 * how signals turn OnPush into precise per-view reactivity.
 */

/** Shared signal used to prove that only the views that READ it get re-rendered. */
@Injectable({ providedIn: 'root' })
export class TickerStore {
  readonly count = signal(0);
}

/** An OnPush child — only re-checked when an input reference changes (or it's marked dirty). */
@Component({
  selector: 'app-onpush-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box">
      <strong>OnPush child</strong> · value: {{ value() }} ·
      <span style="color:var(--violet)">self-checks: {{ tick }}</span>
    </div>
  `,
  styles: [`.box { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; }`],
})
export class OnpushChild {
  value = input(0);
  private n = 0;
  /** Getter runs once per check of THIS view — a live change-detection counter. */
  get tick() {
    return ++this.n;
  }
}

/** OnPush child with an OBJECT input — the star of the mutation trap demo. */
@Component({
  selector: 'app-onpush-mutate-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box">
      <strong>OnPush child sees:</strong> {{ user().name }} clicked
      <strong>{{ user().clicks }}</strong> times
      <span style="color:var(--violet)">· self-checks: {{ tick }}</span>
    </div>
  `,
  styles: [`.box { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; }`],
})
export class OnpushMutateChild {
  user = input.required<{ name: string; clicks: number }>();
  private n = 0;
  get tick() {
    return ++this.n;
  }
}

/**
 * OnPush child that updates its own state ASYNCHRONOUSLY (setTimeout).
 * The event handler itself marks the view dirty, but the timeout callback
 * does not — so without markForCheck the new value never appears.
 */
@Component({
  selector: 'app-onpush-silent-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box">
      <div>async result: <strong>{{ result }}</strong></div>
      <div class="row" style="margin-top:8px">
        <button (click)="loadSilently()">Load (no markForCheck)</button>
        <button (click)="loadAndMark()">Load + markForCheck()</button>
      </div>
    </div>
  `,
  styles: [`.box { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; }`],
})
export class OnpushSilentChild {
  private cdr = inject(ChangeDetectorRef);
  protected result = '—';
  private n = 0;

  protected loadSilently() {
    setTimeout(() => {
      // plain field mutation: no signal, no input, no event → nobody is told
      this.result = `loaded #${++this.n} (you are seeing a STALE view)`;
    }, 300);
  }

  protected loadAndMark() {
    setTimeout(() => {
      this.result = `loaded #${++this.n} (fresh — view was marked dirty)`;
      this.cdr.markForCheck(); // mark this view + ancestors, schedule a pass
    }, 300);
  }
}

/** OnPush child that READS the shared signal — updates when it changes. */
@Component({
  selector: 'app-onpush-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box">
      reads the signal → <strong>{{ store.count() }}</strong>
      <span style="color:var(--green)">· self-checks: {{ tick }}</span>
    </div>
  `,
  styles: [`.box { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; }`],
})
export class OnpushReader {
  readonly store = inject(TickerStore);
  private n = 0;
  get tick() {
    return ++this.n;
  }
}

/** OnPush child that does NOT read the signal — never re-checked by its writes. */
@Component({
  selector: 'app-onpush-nonreader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box">
      reads nothing → snapshot at creation: <strong>{{ snapshot }}</strong>
      <span style="color:var(--amber)">· self-checks: {{ tick }}</span>
    </div>
  `,
  styles: [`.box { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; }`],
})
export class OnpushNonReader {
  readonly snapshot = inject(TickerStore).count();
  private n = 0;
  get tick() {
    return ++this.n;
  }
}

@Component({
  selector: 'app-lesson-onpush',
  imports: [
    RouterLink,
    OnpushChild,
    OnpushMutateChild,
    OnpushSilentChild,
    OnpushReader,
    OnpushNonReader,
  ],
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>OnPush Change Detection</h1>
      <p class="lead">
        <code>ChangeDetectionStrategy.OnPush</code> is a contract you sign with the
        framework: <em>"this component renders purely from its inputs, its own events,
        and the signals/observables it reads — so skip it otherwise."</em> Angular
        holds you to it. This page proves the skip with live counters, walks the
        exact dirty-marking mechanics, and shows every classic way the contract gets
        broken in production.
      </p>

      <h2>Opting in</h2>
      <div class="code"><pre>{{ optInSample }}</pre></div>

      <h2>What re-checks an OnPush view — the complete list</h2>
      <table class="cmp">
        <tr><th>Trigger</th><th>Mechanism</th><th>Scope</th></tr>
        <tr>
          <td><strong>Input reference change</strong></td>
          <td>the template binding writes a new value → the view is marked dirty</td>
          <td>this view (+ ancestors get "traverse me" flags)</td>
        </tr>
        <tr>
          <td><strong>Event bound in its template</strong></td>
          <td>every <code>(click)</code>-style listener wraps the handler in <code>markViewDirty()</code></td>
          <td>this view up to the root</td>
        </tr>
        <tr>
          <td><strong><code>async</code> pipe emission</strong></td>
          <td><code>AsyncPipe</code> literally calls <code>ChangeDetectorRef.markForCheck()</code> on every value</td>
          <td>this view up to the root</td>
        </tr>
        <tr>
          <td><strong>Signal read in the template changed</strong></td>
          <td>the view is a reactive consumer of the signal → marked dirty <em>directly</em></td>
          <td>only the views that read it</td>
        </tr>
        <tr>
          <td><strong>Manual: <code>markForCheck()</code> / <code>detectChanges()</code></strong></td>
          <td>you tell Angular yourself</td>
          <td>next pass / synchronously now</td>
        </tr>
      </table>
      <p>
        Everything else — a <code>setTimeout</code>, a promise resolution, a WebSocket
        message, a third-party callback that mutates a field — changes your data but
        tells nobody. Under OnPush the view stays exactly as it was.
      </p>

      <h2>Live proof #1 — the skip</h2>
      <p>
        The child's <code>self-checks</code> number comes from a getter that increments
        every time Angular re-renders that view, so it is a live change-detection
        counter:
      </p>
      <div class="demo">
        <p class="demo__title">Live — watch the child's self-check counter</p>
        <app-onpush-child [value]="value()" />
        <div class="row" style="margin-top:12px">
          <button (click)="value.update((v) => v + 1)">Change child input (re-checks child)</button>
          <button class="ghost" (click)="poke()">Trigger a CD pass without touching it ({{ pokes() }})</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          The second button updates a signal this <em>lesson</em> reads, so a change
          detection pass runs and the lesson re-renders — but the child's input
          reference didn't change, so the pass <strong>skips its whole subtree</strong>
          and its counter holds still.
        </p>
      </div>

      <h2>Live proof #2 — the mutation trap</h2>
      <p>
        The most common OnPush bug in real codebases: mutating an object in place.
        The reference the child receives is unchanged, so from Angular's point of view
        <em>nothing happened</em>:
      </p>
      <div class="demo">
        <p class="demo__title">Live — parent's actual data: {{ user.name }} / {{ user.clicks }} clicks</p>
        <app-onpush-mutate-child [user]="user" />
        <div class="row" style="margin-top:12px">
          <button class="ghost" (click)="mutate()">user.clicks++ (mutate — child goes STALE)</button>
          <button (click)="replace()">user = {{ '{' }}…user{{ '}' }} (replace — child syncs)</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          After a few mutate clicks the demo title (rendered by this non-OnPush lesson)
          and the child disagree — that's the stale-view bug, live. One replace click
          hands the child a new reference and it catches up instantly.
        </p>
      </div>
      <div class="code"><pre>{{ mutationSample }}</pre></div>

      <h2>Live proof #3 — async work needs markForCheck (or signals)</h2>
      <p>
        The click handler below marks the view dirty (events always do), but by the
        time the <code>setTimeout</code> callback writes the result, that pass is long
        finished. A plain field assignment notifies no one:
      </p>
      <div class="demo">
        <p class="demo__title">Live — the same fetch, with and without notification</p>
        <app-onpush-silent-child />
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:6px">
          "Load (no markForCheck)" really does update the field — you just never see
          it until something else happens to re-check the view (click the other button
          and both updates appear: the stale write was sitting there all along).
        </p>
      </div>
      <div class="code"><pre>{{ markForCheckSample }}</pre></div>

      <h2>Live proof #4 — signals mark exactly the views that read them</h2>
      <div class="demo">
        <p class="demo__title">Live — one signal write, two OnPush children</p>
        <div style="display:grid;gap:10px">
          <app-onpush-reader />
          <app-onpush-nonreader />
        </div>
        <div class="row" style="margin-top:12px">
          <button (click)="store.count.set(store.count() + 1)">store.count.set(+1)</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          The reader's counter climbs with every write; the non-reader — same parent,
          same pass — is never re-checked. This is finer-grained than classic OnPush:
          the signal doesn't just "allow" a check, it names <em>which views</em> to check.
        </p>
      </div>

      <h2>Under the hood — dirty flags and two walks</h2>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <ul>
        <li>
          <strong>Marking walks UP:</strong> <code>markForCheck()</code> flags this view
          <em>and every ancestor</em> up to the root. Ancestors aren't re-rendered —
          they get a "traverse through me" flag so the next pass can reach the dirty view.
        </li>
        <li>
          <strong>Checking walks DOWN:</strong> a change-detection pass starts at the
          root and descends. A Default view is always refreshed; an OnPush view is
          refreshed only if flagged dirty — otherwise its <em>entire subtree</em> is pruned.
        </li>
        <li>
          <strong>Signals are the precision upgrade:</strong> a template that reads a
          signal becomes a reactive consumer; the write marks those consumer views
          directly instead of relying on the "check everything from the root" walk.
        </li>
      </ul>

      <h2>markForCheck vs detectChanges</h2>
      <table class="cmp">
        <tr><th></th><th><code>markForCheck()</code></th><th><code>detectChanges()</code></th></tr>
        <tr>
          <td>What it does</td>
          <td>flags the view (+ ancestor path) dirty; refresh happens on the <em>next scheduled pass</em></td>
          <td>synchronously runs change detection on this view and its children, right now</td>
        </tr>
        <tr>
          <td>Schedules a pass?</td>
          <td>yes (in a zoneless app this is what triggers the tick)</td>
          <td>no scheduling — it IS the check</td>
        </tr>
        <tr>
          <td>Typical use</td>
          <td>async callback updated state outside Angular's knowledge</td>
          <td>forcing a synchronous re-render (tests, imperative DOM measurement flows)</td>
        </tr>
        <tr>
          <td>Risk</td>
          <td>none notable — it's the polite one</td>
          <td>NG0100 (ExpressionChanged…) when called mid-pass; easy to overuse</td>
        </tr>
      </table>

      <h2>Wrong way vs right way</h2>
      <div class="code"><pre>{{ wrongRightSample }}</pre></div>

      <h2>Pitfalls that show up in interviews</h2>
      <ul>
        <li><strong>In-place mutation</strong> of inputs (arrays too: <code>list.push(x)</code> keeps the reference — use <code>[...list, x]</code>).</li>
        <li><strong>Impure template expressions</strong>: <code>{{ '{{' }} Date.now() {{ '}}' }}</code> or a <code>getUser()</code> call freezes under OnPush — nothing marks the view when their result changes.</li>
        <li><strong>Subscribing manually</strong> and assigning to a field: works under Default+zone, silently stale under OnPush. The <code>async</code> pipe (or <code>toSignal</code>) exists precisely because it calls <code>markForCheck</code> for you.</li>
        <li><strong>Third-party libs</strong> (charts, maps) mutating shared state in their own callbacks — wrap the state write in a signal or call <code>markForCheck()</code>.</li>
        <li><strong>OnPush on the container, Default on a child</strong>: skipping the container prunes the child too — the child's strategy never even gets consulted if the parent subtree is skipped.</li>
      </ul>

      <div class="tip">
        With <strong>signals</strong>, OnPush "just works": reading a signal in the
        template registers the view as a consumer, and every write marks exactly those
        views dirty. New Angular code is effectively OnPush-by-default and pairs with
        <a routerLink="/zoneless">zoneless</a> scheduling — this app itself runs zoneless.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>An OnPush child renders a stale user name after the parent updates it. Three possible causes?</summary>
        <div>(1) The parent mutated the user object in place — same reference, no
        dirty mark. (2) The value was assigned in an async callback without
        <code>markForCheck()</code>/signal. (3) The template calls an impure function
        or getter whose result changed without any input changing. Fixes: replace the
        reference, use the async pipe / signals, or mark manually.</div>
      </details>
      <details class="qa">
        <summary>Why does the async pipe "fix" OnPush components with observables?</summary>
        <div>Because on every emission <code>AsyncPipe</code> calls
        <code>ChangeDetectorRef.markForCheck()</code>. Manual
        <code>subscribe()</code> + field assignment skips that step, which is why it
        breaks under OnPush.</div>
      </details>
      <details class="qa">
        <summary>markForCheck() was called but nothing re-rendered until the user clicked. Why (classic zone-era question)?</summary>
        <div><code>markForCheck()</code> only flags views — under zone.js it does not
        itself schedule a pass; something else (the click) had to trigger the tick.
        Modern zoneless Angular fixed exactly this: marking notifies the scheduler,
        so a pass always follows.</div>
      </details>
      <details class="qa">
        <summary>A click inside an OnPush component re-renders it even though no input changed. Why?</summary>
        <div>Angular wraps every template event listener so that firing it calls
        <code>markViewDirty()</code> on the component's view before your handler runs.
        Events from inside the component (or its children) are one of the OnPush
        re-check triggers by design.</div>
      </details>
      <details class="qa">
        <summary>What exactly does a CD pass skip for a clean OnPush view?</summary>
        <div>The whole subtree: bindings aren't re-evaluated, getters aren't called,
        child components aren't visited. Ancestors flagged with "traverse me" are
        descended <em>through</em> without being refreshed, so one dirty leaf doesn't
        force work on its clean ancestors.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>OnPush re-checks on exactly five things: input <em>reference</em> change, own template events, async-pipe emissions, signal reads, and manual marking. Everything else = stale view.</li>
        <li>Treat inputs as <strong>immutable</strong> — replace objects/arrays, never mutate.</li>
        <li>Marking walks <em>up</em> (view + ancestor path), checking walks <em>down</em> (root → leaves, pruning clean OnPush subtrees).</li>
        <li><code>markForCheck()</code> flags for the next pass; <code>detectChanges()</code> checks synchronously — know which one a question is really asking about.</li>
        <li>Signals subsume the whole pattern: writes mark precisely the reading views, which is the bridge to zoneless.</li>
      </ul>

      <p><a routerLink="/zoneless">Next: Zoneless Angular →</a></p>
    </article>
  `,
})
export class Onpush {
  protected readonly value = signal(0);
  protected readonly pokes = signal(0);
  protected readonly store = inject(TickerStore);

  /** Plain (non-signal) object on purpose — the mutation-trap demo star. */
  protected user = { name: 'Ada', clicks: 0 };

  protected poke() {
    this.pokes.update((p) => p + 1);
  }

  protected mutate() {
    this.user.clicks++; // same reference — OnPush child never notices
  }

  protected replace() {
    this.user = { ...this.user }; // new reference — input binding marks the child
  }

  readonly optInSample = `@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // …
})`;

  readonly mutationSample = `// WRONG — same reference, OnPush child stays stale
this.user.clicks++;

// RIGHT — new reference, the input binding marks the child dirty
this.user = { ...this.user, clicks: this.user.clicks + 1 };

// arrays too:
this.items.push(item);          // stale
this.items = [...this.items, item];  // fresh`;

  readonly markForCheckSample = `private cdr = inject(ChangeDetectorRef);

load() {
  this.api.fetch().subscribe((data) => {
    this.data = data;        // field write — nobody is notified
    this.cdr.markForCheck(); // flag view + ancestors, schedule a pass
  });
}

// …or skip the ceremony entirely:
readonly data = toSignal(this.api.fetch());   // signal read marks the view
readonly data$ = this.api.fetch();            // async pipe calls markForCheck`;

  readonly underTheHoodSample = `// marking: WALKS UP — flag me, and flag the path so the pass can reach me
markForCheck()  →  view.flags |= Dirty
                   for each ancestor: flags |= HasChildViewsToRefresh

// checking: WALKS DOWN from the root
refreshView(root)
  Default view?            → refresh bindings, descend
  OnPush view, dirty?      → refresh bindings, descend, clear flag
  OnPush view, clean?      → PRUNE — skip the entire subtree
  clean but "traverse me"? → descend without refreshing (reach the dirty leaf)`;

  readonly wrongRightSample = `// WRONG — impure expression: freezes under OnPush
template: '{{ getTotal() }} at {{ Date.now() }}'

// RIGHT — computed signal: recomputes AND marks the view when deps change
readonly total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
template: '{{ total() }}'

// WRONG — manual subscribe + field assignment (stale under OnPush)
this.users$.subscribe((u) => (this.users = u));

// RIGHT — let the pipe/signal do the marking
template: '@for (u of users$ | async; track u.id) { … }'
readonly users = toSignal(this.users$, { initialValue: [] });`;
}
