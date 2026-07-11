import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Debugging — error anatomy and stack-trace reading (bottom-up story,
 * top-down blame), an error-type field guide with live triggerable examples,
 * console techniques beyond console.log, DevTools tour, breakpoints vs logs,
 * and the scientific method of hypothesis-driven debugging.
 */

interface BugCase {
  label: string;
  code: string;
  error: string;
  reading: string;
  fix: string;
}

const BUG_CASES: BugCase[] = [
  {
    label: 'TypeError (undefined)',
    code: `const user = {};\nconst city = user.address.city;`,
    error: `TypeError: Cannot read properties of undefined (reading 'city')\n    at showUser (app.ts:42:29)\n    at onClick (app.ts:30:5)`,
    reading:
      "Read it inside-out: reading 'city' failed because the thing before it — user.address — was undefined. The error names the property it was READING (city), so the undefined thing is whatever came before the last dot.",
    fix: `user.address?.city   // optional chaining: stop safely at the missing link\n// …or fix WHY address is missing — the ?. treats the symptom`,
  },
  {
    label: 'ReferenceError',
    code: `const userName = 'Ada';\nconsole.log(usarName);`,
    error: `ReferenceError: usarName is not defined\n    at greet (app.ts:12:15)`,
    reading:
      'The name itself does not exist in scope — nothing was ever declared with that exact spelling. 95% of the time: a typo (usarName vs userName) or a missing import.',
    fix: `console.log(userName);   // spelling — editors underline these before you even run`,
  },
  {
    label: 'SyntaxError',
    code: `function add(a, b) {\n  return a + b;\n// ← missing closing brace`,
    error: `SyntaxError: Unexpected end of input`,
    reading:
      'The file is malformed, so NOTHING ran — this error happens at parse time, before execution. "Unexpected end of input" = the parser reached the end while still waiting for something (here, a closing brace). The real mistake is often lines ABOVE where the parser gave up.',
    fix: `function add(a, b) {\n  return a + b;\n}   // balanced — editors highlight matching brackets; trust them`,
  },
  {
    label: 'The silent bug',
    code: `const total = price + tax;   // price = "10" (a string from an input!)`,
    error: `(no error at all — total is "1052" and the page shows a nonsense number)`,
    reading:
      'The nastiest kind: no red text, just wrong behaviour. JavaScript happily glued "10" + 52. No stack trace will help — this is where you log the VALUES and check your assumptions about them.',
    fix: `console.log(typeof price, price);   // "string" "10" ← assumption busted\nconst total = Number(price) + tax;   // convert first (TypeScript would have caught this)`,
  },
];

@Component({
  selector: 'app-lesson-debugging-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Your Dev Toolkit</span>
      <h1>Debugging &amp; Reading Errors</h1>
      <p class="lead">
        Every programmer — beginner to expert — writes code that breaks. The
        difference is that experts have a <em>method</em>: read the message, form a
        hypothesis, test it with evidence, fix, re-run. Errors aren't scary failures;
        they're the computer telling you exactly what's wrong and where. This page
        teaches you to read every part of one, and what to do when there's no error
        at all.
      </p>

      <h2>Anatomy of an error — all three parts matter</h2>
      <div class="code"><pre>TypeError: Cannot read properties of undefined (reading 'name')
└───┬───┘  └──────────────────────┬─────────────────────────┘
 ① TYPE      ② MESSAGE — what actually went wrong

    at showUser (app.ts:42:18)     ┐ ③ STACK TRACE — the trail of calls,
    at onClick (app.ts:30:5)       ┘   MOST RECENT FIRST: line 42, file app.ts,
                                       column 18. onClick called showUser.</pre></div>
      <p>How to read the stack trace — two directions, two questions:</p>
      <ul>
        <li><strong>Top line = where it exploded.</strong> Your first destination: <code>app.ts:42</code>. In an Angular app many trace lines are framework internals — scan down to the first line that's <em>your</em> file and start there.</li>
        <li><strong>Reading downward = the story of how we got there.</strong> "onClick ran, which called showUser, which blew up." When line 42 looks innocent, the bug is often upstream: someone passed bad data <em>into</em> the exploding function. The trace is your list of suspects, in order.</li>
      </ul>

      <h2>Field guide — trigger each one, read it, fix it</h2>
      <div class="demo">
        <p class="demo__title">Live — four classic bugs</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (b of bugs; track b.label) {
            <button [class.ghost]="bug() !== b" (click)="bug.set(b)">{{ b.label }}</button>
          }
        </div>
        @if (bug(); as b) {
          <p style="margin:6px 0 4px;font-size:.85rem;color:var(--text-muted)">The code:</p>
          <div class="code"><pre>{{ b.code }}</pre></div>
          <p style="margin:10px 0 4px;font-size:.85rem;color:var(--text-muted)">What appears in the console:</p>
          <div class="code"><pre>{{ b.error }}</pre></div>
          <p style="font-size:.92rem"><strong>How to read it:</strong> {{ b.reading }}</p>
          <p style="margin:10px 0 4px;font-size:.85rem;color:var(--text-muted)">The fix:</p>
          <div class="code"><pre>{{ b.fix }}</pre></div>
        } @else {
          <p style="color:var(--text-muted)">Pick a bug. Each shows the code, the console output, and how a practiced eye reads it.</p>
        }
      </div>
      <table class="t">
        <tr><td><code>TypeError</code></td><td>A value was used the wrong way — overwhelmingly: reading a property of <code>undefined</code>/<code>null</code>. Look <em>before the last dot</em>.</td></tr>
        <tr><td><code>ReferenceError</code></td><td>The name doesn't exist at all — typo or missing import.</td></tr>
        <tr><td><code>SyntaxError</code></td><td>Malformed code; nothing ran. Unbalanced <code>) {{ '}' }} ]</code> or a stray comma — often above the reported line.</td></tr>
        <tr><td><em>(silent)</em></td><td>No error, wrong result. No trace to follow — switch from reading errors to <strong>checking assumptions with logs</strong>.</td></tr>
      </table>

      <h2>Tool #1: the console — more than console.log</h2>
      <div class="code"><pre>console.log('user is:', user);   // ← label + value. ALWAYS label your logs:
                                 //   five bare numbers in a console are useless
console.log({{ '{' }} user {{ '}' }});          // neat trick: braces log it AS "user: …" for free

console.table(users);            // arrays of objects → a readable grid
console.error('bad state');      // red + stack trace — visually loud
console.count('render');         // "render: 1, 2, 3…" — how OFTEN does this line run?
console.time('load');            // …
console.timeEnd('load');         // "load: 231ms" — how LONG did this take?</pre></div>
      <p>
        Half of all debugging is one sentence: <em>"I assumed this value was X;
        logging proved it was Y."</em> The log's job is to test an assumption. Which
        means: before you log, say out loud what you <em>expect</em> to see — if you
        can't, you're not debugging yet, you're staring.
      </p>

      <h2>Try it — read an error end to end</h2>
      <div class="demo">
        <p class="demo__title">Live — trigger a real bug, then walk the checklist</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="triggerBug()">Run buggy code</button>
          <button class="ghost" (click)="clear()">clear</button>
        </div>
        @if (log()) {
          <div class="code"><pre>{{ log() }}</pre></div>
          <p style="color:var(--green)">
            👆 Checklist: ① type = TypeError → a value misused. ② message names
            'city' → so the thing before <code>.city</code> was undefined —
            that's <code>user.address</code>. ③ top trace line = your file, line 42.
            Fix at the source (why is address missing?) or guard with
            <code>user.address?.city</code>.
          </p>
        }
      </div>

      <h2>Tool #2: DevTools — the cockpit (F12)</h2>
      <ul>
        <li><strong>Console</strong> — your logs and every uncaught error. The file:line on the right of each entry is a <em>link</em> — click it to jump straight to the code.</li>
        <li><strong>Elements</strong> — the live DOM (remember: the current tree, not your HTML file). Click an element and see exactly which CSS rules apply and which are crossed out — this is how CSS mysteries get solved.</li>
        <li><strong>Network</strong> — every request the app makes: URL, status code, and the JSON that actually came back. When "the data is wrong", look here first — was it the server's answer, or what your code did with it?</li>
        <li><strong>Sources</strong> — set a <strong>breakpoint</strong>: click a line number and the code <em>pauses there</em> next time it runs. Hover any variable to see its value, then step line by line. It's console.log on everything at once, without editing code.</li>
      </ul>
      <div class="note">
        <strong>Log or breakpoint?</strong> Logs shine for "how does this value change
        <em>over time / many events</em>" (each click, each request). Breakpoints
        shine for "what is the <em>entire world</em> at this one moment". Beginners
        over-use logs because breakpoints feel advanced — spend ten minutes learning
        them and you'll save hours per week.
      </div>

      <h2>The method — debugging as science</h2>
      <ol>
        <li><strong>Read the whole error</strong> — type, message, first line of yours in the trace. (Not the first 5 words. The whole thing.)</li>
        <li><strong>Reproduce it</strong> — find the exact steps that trigger it every time. A bug you can't reproduce is a bug you can't verify you fixed.</li>
        <li><strong>Hypothesize</strong> — "I think <code>address</code> is undefined because the API omits it for new users."</li>
        <li><strong>Test the hypothesis</strong> — log it / breakpoint it / check the Network tab. Evidence, not vibes.</li>
        <li><strong>Fix the cause, re-run the reproduction</strong> — and make sure you fixed the <em>reason</em>, not just the symptom (a <code>?.</code> that hides missing data may be deferring the crash to someone else's screen).</li>
      </ol>
      <div class="tip">
        Two force-multipliers: <strong>search the exact error text</strong> (quotes
        around it, minus your variable names) — someone has hit it before; and
        <strong>explain the bug out loud</strong> to a colleague, a duck, or an empty
        chair. Verbalizing forces you through the evidence in order — the answer
        routinely arrives mid-sentence ("rubber-duck debugging" is a real, named
        technique).
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>The console says "Cannot read properties of undefined (reading 'filter')" on the line <code>items.filter(x =&gt; x.done)</code>. What exactly was undefined?</summary>
        <div><code>items</code>. The parenthetical names the property being
        <em>read</em> ('filter'), and the undefined thing is whatever it was read
        <em>from</em> — one link to the left of the named property. So the question
        to chase is "why hadn't items been assigned yet?" (Classic answer in Angular:
        the data hadn't arrived from the server when the code ran — an async-timing
        bug from the Async lesson.)</div>
      </details>
      <details class="qa">
        <summary>Your fix didn't work. What's the first thing to verify?</summary>
        <div>That the code you edited is the code that ran: is the dev server still
        running / did it recompile / did the browser reload / are you editing the
        right file? "The fix changed nothing" is very often "the fix never
        executed". Add an obvious log next to the fix to prove it runs.</div>
      </details>
      <details class="qa">
        <summary>The page shows a wrong total but the console is clean. Outline your approach.</summary>
        <div>No error = assumption-checking mode. Follow the data: log the raw
        inputs (are they numbers or strings? Network tab shows what the API truly
        sent), then the intermediate values, then the final calculation — and state
        your expectation before each log. The bug lives at the first log that
        surprises you.</div>
      </details>
      <details class="qa">
        <summary>Why is a SyntaxError's line number sometimes "wrong"?</summary>
        <div>The parser reports where it <em>gave up</em>, not where you erred. A
        brace unclosed on line 10 may only become impossible at line 40 (or at end
        of file). When the reported line looks fine, scan upward for unbalanced
        brackets — or let the editor's bracket-matching find it instantly.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>An error = <strong>type + message + stack trace</strong>. Top of the trace = where; reading down = how it got there; first line in <em>your</em> files = where to start.</li>
        <li>For "reading 'x' of undefined": the undefined thing is one link <em>left</em> of 'x'. ReferenceError = typo/import; SyntaxError = nothing ran, look above the reported line.</li>
        <li>Silent bugs (wrong result, clean console) are found by <strong>logging labelled values against stated expectations</strong> — the bug is at the first surprise.</li>
        <li>DevTools: Console (logs), Elements (live DOM + applied CSS), Network (what the server really said), Sources (breakpoints = inspect everything at a paused moment).</li>
        <li>Debug scientifically: read → reproduce → hypothesize → test with evidence → fix the cause and re-run. Search exact error text; explain it out loud.</li>
      </ul>

      <p><a routerLink="/why-typescript-angular">Next: Why TypeScript &amp; Angular? →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; white-space: nowrap; }

     ol li { margin: 8px 0; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class DebuggingBasics {
  protected readonly log = signal('');
  protected readonly bugs = BUG_CASES;
  protected readonly bug = signal<BugCase | null>(null);

  protected triggerBug() {
    // Deliberately cause and catch an error to show how to read it.
    try {
      const user: { address?: { city: string } } = {};
      // @ts-expect-error — intentional bug for the lesson
      const city = user.address.city;
      this.log.set(String(city));
    } catch (e) {
      const err = e as Error;
      this.log.set(
        `${err.name}: ${err.message}\n    at triggerBug (debugging-basics.ts:42:31)\n    at onClick (debugging-basics.ts:30:5)`,
      );
    }
  }
  protected clear() {
    this.log.set('');
  }
}
