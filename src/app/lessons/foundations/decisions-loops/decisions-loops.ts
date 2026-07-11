import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Decisions & loops — if/else mechanics, truthiness, the three-part
 * anatomy of a for loop (traced live), for...of, while, break/continue,
 * map/filter/reduce with a live pipeline, and how all of this maps onto
 * Angular's @if/@for template syntax later.
 */

interface LoopFrame {
  phase: string;
  i: string;
  test: string;
  output: string[];
  note: string;
}

/** Every micro-step of `for (let i = 0; i < 3; i++)` — the loop, slowed down. */
const LOOP_FRAMES: LoopFrame[] = [
  { phase: '① init', i: '0', test: '—', output: [], note: 'Runs ONCE before anything: create the counter box i = 0.' },
  { phase: '② test', i: '0', test: '0 < 3 → true', output: [], note: 'Before every lap: is the condition still true? Yes → enter the body.' },
  { phase: '③ body', i: '0', test: '—', output: ['Hello 0'], note: 'Run the code between the braces with the current i.' },
  { phase: '④ step', i: '1', test: '—', output: ['Hello 0'], note: 'After the body: i++ bumps the counter to 1. Back to the test.' },
  { phase: '② test', i: '1', test: '1 < 3 → true', output: ['Hello 0'], note: 'Still true → another lap.' },
  { phase: '③ body', i: '1', test: '—', output: ['Hello 0', 'Hello 1'], note: 'Body runs again, this time i is 1.' },
  { phase: '④ step', i: '2', test: '—', output: ['Hello 0', 'Hello 1'], note: 'i++ → 2. Back to the test.' },
  { phase: '② test', i: '2', test: '2 < 3 → true', output: ['Hello 0', 'Hello 1'], note: 'True one last time.' },
  { phase: '③ body', i: '2', test: '—', output: ['Hello 0', 'Hello 1', 'Hello 2'], note: 'Third and final body run.' },
  { phase: '④ step', i: '3', test: '—', output: ['Hello 0', 'Hello 1', 'Hello 2'], note: 'i++ → 3.' },
  { phase: '② test', i: '3', test: '3 < 3 → FALSE', output: ['Hello 0', 'Hello 1', 'Hello 2'], note: 'The test finally fails → the loop ends. Execution continues after the closing brace. Total: 3 laps, and i ended at 3, not 2.' },
];

@Component({
  selector: 'app-lesson-decisions-loops',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Decisions &amp; Loops</h1>
      <p class="lead">
        So far our code runs straight down, top to bottom. Real programs need to
        <strong>make decisions</strong> ("if the user is logged in, show the dashboard")
        and <strong>repeat work</strong> ("for every product, show a card"). Branching
        and looping are the control flow of every program you will ever read — and
        they reappear, renamed, inside Angular templates as <code>&#64;if</code> and
        <code>&#64;for</code>.
      </p>

      <h2>Making decisions with <code>if</code></h2>
      <p>
        An <code>if</code> statement runs a block of code <em>only when</em> a condition
        is <code>true</code>. Reading it piece by piece:
      </p>
      <div class="code">
        <pre>const age = 20;

if (age >= 18) {{ '{' }}                    // ← the condition, in parentheses
  console.log('You can vote.');      // ← the "then" block: runs when true
{{ '}' }} else {{ '{' }}
  console.log('Too young.');         // ← the "else" block: runs otherwise
{{ '}' }}</pre>
      </div>
      <ul>
        <li><strong>Line 3, the condition:</strong> <code>age >= 18</code> is evaluated first and collapses to a single boolean — here <code>20 >= 18</code> → <code>true</code>. Anything boolean-valued can go here.</li>
        <li><strong>The braces <code>{{ '{' }} {{ '}' }}</code>:</strong> group the lines that belong to that branch. Exactly one branch runs — never both, never neither (when an <code>else</code> exists).</li>
        <li><strong><code>else</code> is optional:</strong> without it, a false condition simply skips the block and life continues below.</li>
      </ul>
      <p>Chains test conditions <em>top to bottom, first match wins</em> — order matters:</p>
      <div class="code">
        <pre>if (score > 90)      grade = 'A';   // tested first
else if (score > 80) grade = 'B';   // only reached when score <= 90
else                 grade = 'C';   // the catch-all

// ⚠️ reversed order would be a bug:
// if (score > 80) grade = 'B';     ← a 95 stops HERE and never sees the A test</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Live — a decision in action</p>
        <div class="field">
          <label>Your age</label>
          <input type="number" [value]="age()" (input)="age.set(+$any($event.target).value)" />
        </div>
        <div class="code"><pre>if (age >= 18) {{ '{' }} message = 'You can vote 🗳️' {{ '}' }}
else        {{ '{' }} message = 'Too young to vote' {{ '}' }}

→ {{ voteMessage() }}</pre></div>
      </div>

      <h2>Truthiness — the gotcha inside every condition</h2>
      <p>
        JavaScript lets <em>any</em> value stand where a boolean is expected, silently
        converting it. Six values convert to <code>false</code> (the "falsy six") —
        everything else is truthy:
      </p>
      <div class="code"><pre>// the falsy six:
false   0   ''   null   undefined   NaN

if (userName) {{ '{' }} … {{ '}' }}     // runs unless userName is '' / null / undefined
if (items.length) {{ '{' }} … {{ '}' }} // runs when the array has at least one item

// ⚠️ trap: 0 is falsy but often a VALID value —
const discount = 0;
if (discount) {{ '{' }} … {{ '}' }}     // skipped! 0 fails the test even though 0 is real data
if (discount !== undefined) {{ '{' }} … {{ '}' }}  // ✅ say what you actually mean</pre></div>
      <p>
        Truthiness makes conditions short, but the professional habit is: when 0 or
        <code>''</code> are legitimate values, compare explicitly. You'll meet the
        polished fix (<code>??</code>, the nullish operator) in the TypeScript tier.
      </p>

      <h2>The <code>for</code> loop — three parts, traced live</h2>
      <p>
        The classic counting loop packs three instructions into its header:
        <strong>① init</strong> (once, before), <strong>② test</strong> (before every
        lap), <strong>③ body</strong>, <strong>④ step</strong> (after every lap).
        Step through every micro-moment of a real three-lap loop:
      </p>
      <div class="code"><pre>for (let i = 0;  i < 3;  i++) {{ '{' }}
     └─ ① ─┘   └─ ② ─┘ └ ④ ┘
  console.log('Hello ' + i);   // ← ③ the body
{{ '}' }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — one micro-step at a time</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="frameBack()" [disabled]="frame() === 0" class="ghost">← Back</button>
          <button (click)="frameFwd()" [disabled]="frame() === frames.length - 1">Step →</button>
          <button class="ghost" (click)="frame.set(0)">Reset</button>
        </div>
        <div class="loop-state">
          <div class="ls-box"><span>phase</span><strong>{{ frames[frame()].phase }}</strong></div>
          <div class="ls-box"><span>i</span><strong>{{ frames[frame()].i }}</strong></div>
          <div class="ls-box"><span>test</span><strong>{{ frames[frame()].test }}</strong></div>
        </div>
        <p style="font-size:.9rem;margin:10px 0 6px">{{ frames[frame()].note }}</p>
        <div class="console">
          @for (line of frames[frame()].output; track $index) {
            <div>{{ line }}</div>
          } @empty {
            <div class="dim">// console output appears here…</div>
          }
        </div>
      </div>
      <div class="note">
        Two details everyone gets asked eventually: the loop runs while the test is
        true (so <code>i &lt; 3</code> gives laps 0, 1, 2 — <em>three</em> laps, and
        <strong>i ends at 3</strong>); and starting at 0 is deliberate — almost
        everything in programming counts from zero, including array positions.
      </div>

      <h2>The loops you'll actually write</h2>
      <div class="code"><pre>// "for...of" — walk every ITEM of an array; no counter bookkeeping to get wrong:
for (const fruit of ['apple', 'banana', 'cherry']) {{ '{' }}
  console.log(fruit);          // apple, then banana, then cherry
{{ '}' }}

// "while" — loop when you don't know the lap count in advance:
let tries = 0;
while (!connected && tries < 5) {{ '{' }}
  attemptConnection();
  tries++;                     // ⚠️ forget this line → infinite loop, frozen tab
{{ '}' }}

// escape hatches, valid in any loop:
break;      // leave the loop entirely, right now
continue;   // abandon THIS lap, jump to the next test</pre></div>
      <ul>
        <li><code>for...of</code> replaces 90% of counting loops: no off-by-one bugs, reads like English. Use the counting <code>for</code> only when you genuinely need the index.</li>
        <li><code>while</code> is for "until something happens" — retries, polling, games. Its danger is the <strong>infinite loop</strong>: if the condition never turns false, the browser tab freezes. Something in the body must move toward the exit.</li>
      </ul>

      <h2>The modern way: <code>map</code>, <code>filter</code>, <code>reduce</code></h2>
      <p>
        Most production code doesn't write raw loops at all. Arrays carry helper
        methods that do the looping for you — you supply a small arrow function
        describing what to do with <em>one item</em>, and it's applied to each:
      </p>
      <div class="code"><pre>const nums = [1, 2, 3, 4, 5, 6];

nums.map(n => n * 10)          // [10, 20, 30, 40, 50, 60]  transform each (same count)
nums.filter(n => n % 2 === 0)  // [2, 4, 6]                 keep passers (fewer or same)
nums.reduce((sum, n) => sum + n, 0)   // 21                 boil down to ONE value

// and they CHAIN — each returns a new array for the next to consume:
nums.filter(n => n % 2 === 0)  // [2, 4, 6]
    .map(n => n * 10)          // [20, 40, 60]
    .reduce((s, n) => s + n, 0) // 120</pre></div>
      <ul>
        <li><strong><code>map</code></strong> — same length out, every item transformed. "Turn each product into a price."</li>
        <li><strong><code>filter</code></strong> — the arrow function is a yes/no test; survivors pass through unchanged. "Keep the in-stock products."</li>
        <li><strong><code>reduce</code></strong> — carries an accumulator (<code>sum</code>) across items; the <code>0</code> is its starting value. "Total the cart." Trickier to read — reach for it when you need one value out of many.</li>
        <li><strong>None of them touch the original array</strong> — they build new ones. That "don't mutate, produce anew" habit becomes a load-bearing rule when you reach OnPush change detection in the expert tier.</li>
      </ul>

      <div class="demo">
        <p class="demo__title">Live — build a pipeline over 1–8</p>
        <p>start: <code>[{{ nums.join(', ') }}]</code></p>
        <div class="row" style="margin:8px 0;flex-wrap:wrap">
          <button [class.ghost]="!useFilter()" (click)="useFilter.update(v => !v)">filter: even</button>
          <span class="dim">then</span>
          <button [class.ghost]="!useMap()" (click)="useMap.update(v => !v)">map: × 3</button>
          <span class="dim">then</span>
          <button [class.ghost]="!useReduce()" (click)="useReduce.update(v => !v)">reduce: sum</button>
        </div>
        <div class="code"><pre>{{ pipelineExpr() }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Toggle stages on and off — each stage feeds the next, and the original array
          is never modified.
        </p>
      </div>

      <div class="note">
        Why prefer these over raw loops? They read like English, they can't
        off-by-one, they don't mutate, and they are <em>exactly</em> the mental model
        Angular templates use: <code>&#64;for (item of items)</code> is
        <code>for...of</code>, <code>&#64;if</code> is <code>if</code>, and a
        "filter the list, then render it" feature is literally
        <code>filter().map()</code> spread across a component and its template.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>How many times does <code>for (let i = 1; i &lt;= 5; i += 2)</code> loop, and what values does i take?</summary>
        <div>Three laps: i = 1, 3, 5. The step can be anything — <code>i += 2</code>
        counts by twos. After the loop i is 7 (the first value that failed the test).</div>
      </details>
      <details class="qa">
        <summary>What's the output length of <code>[1,2,3].map(...)</code> vs <code>[1,2,3].filter(...)</code>?</summary>
        <div><code>map</code> always returns exactly 3 items (one transformed output per
        input — even if the transform returns the same value). <code>filter</code>
        returns 0–3 depending on how many pass. If you find yourself wanting map to
        "skip" items, you actually want <code>filter().map()</code>.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>if (items.length)</code> work as "is the array non-empty?"</summary>
        <div>Truthiness: an empty array has <code>length</code> 0, and 0 is falsy;
        any other length is a non-zero number, which is truthy. It's idiomatic and
        safe here because length can't be null — but remember the discount-0 trap when
        the value itself could legitimately be 0.</div>
      </details>
      <details class="qa">
        <summary>Spot the infinite loop: <code>let i = 10; while (i > 0) {{ '{' }} console.log(i); {{ '}' }}</code></summary>
        <div>Nothing inside the body changes <code>i</code>, so the test is true
        forever and the tab freezes. Fix: <code>i--</code> inside the body. Every
        while loop needs something moving it toward the exit — check for that first
        whenever a page hangs.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>if / else if / else</code> picks exactly one branch, testing top-to-bottom — order your conditions from most to least specific.</li>
        <li>Conditions use <strong>truthiness</strong>: <code>false, 0, '', null, undefined, NaN</code> are falsy; compare explicitly when 0 or '' are real values.</li>
        <li>A <code>for</code> loop is ① init → ② test → ③ body → ④ step, looping while the test is true; <code>for...of</code> walks items and avoids counter bugs; <code>while</code> needs a visible path to the exit.</li>
        <li><code>map</code> transforms, <code>filter</code> selects, <code>reduce</code> aggregates — they chain, never mutate, and are the style Angular code uses everywhere.</li>
        <li>Template control flow (<code>&#64;if</code>, <code>&#64;for</code>) is these exact ideas wearing Angular syntax.</li>
      </ul>

      <p><a routerLink="/dom-and-events">Next: The DOM &amp; Events →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 90px; color: var(--text-muted); }
     .dim { color: var(--text-muted); font-size: .85rem; }

     .loop-state { display: flex; gap: 10px; flex-wrap: wrap; }
     .ls-box { border: 1px solid var(--border); border-radius: 10px; padding: 8px 14px; min-width: 90px; text-align: center; }
     .ls-box span { display: block; font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
     .ls-box strong { font-family: monospace; }

     /* Fixed dark console — colours must not come from theme vars (see styles.css --code-fg note). */
     .console { background: var(--code-bg); color: var(--code-fg); border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: .82rem; min-height: 70px; }
     .console .dim { color: #8b93a8; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class DecisionsLoops {
  protected readonly age = signal(20);
  protected readonly voteMessage = computed(() =>
    this.age() >= 18 ? 'You can vote 🗳️' : 'Too young to vote',
  );

  protected readonly frames = LOOP_FRAMES;
  protected readonly frame = signal(0);
  protected frameFwd() {
    this.frame.update((f) => Math.min(f + 1, this.frames.length - 1));
  }
  protected frameBack() {
    this.frame.update((f) => Math.max(f - 1, 0));
  }

  protected readonly nums = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly useFilter = signal(true);
  protected readonly useMap = signal(false);
  protected readonly useReduce = signal(false);

  /** Renders the chained pipeline with the intermediate value after each stage. */
  protected readonly pipelineExpr = computed(() => {
    let arr: number[] = this.nums;
    let text = `[${this.nums.join(', ')}]`;
    if (this.useFilter()) {
      arr = arr.filter((n) => n % 2 === 0);
      text += `\n  .filter(n => n % 2 === 0)   → [${arr.join(', ')}]`;
    }
    if (this.useMap()) {
      arr = arr.map((n) => n * 3);
      text += `\n  .map(n => n * 3)            → [${arr.join(', ')}]`;
    }
    if (this.useReduce()) {
      const sum = arr.reduce((s, n) => s + n, 0);
      text += `\n  .reduce((s, n) => s + n, 0) → ${sum}`;
    }
    return text;
  });
}
