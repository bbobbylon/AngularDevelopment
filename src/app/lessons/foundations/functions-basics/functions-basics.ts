import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Functions — definition vs call, parameters vs arguments, return
 * (including the "return ends the function" rule), a live call traced
 * step-by-step, scope, arrow functions, functions-as-values (callbacks) —
 * the concept that unlocks map/filter, event handlers and all of RxJS later.
 */

interface CallFrame {
  stage: string;
  detail: string;
  code: string;
}

/** One call of tip(50, 20), slowed down to its four moments. */
const CALL_TRACE: CallFrame[] = [
  {
    stage: '1 · The call',
    code: `const t = tip(50, 20);`,
    detail:
      'Execution reaches this line. The parentheses after a name mean "run it". Before anything is assigned to t, the program JUMPS into the function, carrying the two argument values along.',
  },
  {
    stage: '2 · Parameters filled',
    code: `function tip(bill, percent)  →  bill = 50, percent = 20`,
    detail:
      'Inside the function, the parameter names become real variables pre-loaded with the arguments, matched by position: first argument → first parameter. These boxes exist ONLY inside this call.',
  },
  {
    stage: '3 · The body runs',
    code: `return bill * (percent / 100);   // 50 * 0.2 → 10`,
    detail:
      'The body computes. When it hits return, two things happen at once: the function ENDS immediately (any lines below are skipped), and the value 10 travels back to the call site.',
  },
  {
    stage: '4 · Back at the call site',
    code: `const t = 10;   // the call was REPLACED by its return value`,
    detail:
      'The expression tip(50, 20) has collapsed into 10, and normal top-to-bottom execution resumes. Mental model: a function call is an expression that gets replaced by whatever it returns. bill and percent are gone — they lived only for the duration of the call.',
  },
];

@Component({
  selector: 'app-lesson-functions-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Functions</h1>
      <p class="lead">
        A function is a <strong>reusable set of instructions with a name</strong>.
        Instead of writing the same steps over and over, you wrap them once and
        "call" them by name. But there's a deeper idea hiding here that powers
        everything from <code>map</code> to Angular event handlers: <em>a function is
        itself a value</em> — you can store it, pass it, and hand it to someone else
        to run later. This page builds both ideas.
      </p>

      <h2>The vending-machine anatomy</h2>
      <p>
        Input goes in, work happens inside, output comes back. In code those parts
        are <em>parameters</em>, the <em>body</em>, and the <em>return value</em>:
      </p>
      <div class="code"><pre>function double(n) {{ '{' }}
└──┬───┘ └─┬──┘└┬┘
"defining  its   parameter: a placeholder variable
a function" name  that will hold whatever comes in

  return n * 2;   // the body: do the work, send the answer OUT
{{ '}' }}

double(5)    // → 10     "calling" it: parentheses mean RUN
double(8)    // → 16     same machine, different input</pre></div>
      <ul>
        <li><strong>Defining ≠ running.</strong> The <code>function</code> block just <em>creates</em> the machine — nothing inside executes until a call happens. A function defined but never called is code that never runs.</li>
        <li><strong>Parameter vs argument:</strong> the placeholder in the definition (<code>n</code>) is a <em>parameter</em>; the real value at the call (<code>5</code>) is an <em>argument</em>. Multiple inputs are separated by commas and matched <em>by position</em>: <code>add(2, 3)</code> fills <code>a=2, b=3</code>.</li>
        <li><strong><code>return</code> does two jobs:</strong> it hands the value back <em>and immediately ends the function</em>. Code after a return never runs. A function with no return hands back <code>undefined</code>.</li>
      </ul>

      <h2>Watch one call happen, moment by moment</h2>
      <div class="demo">
        <p class="demo__title">Live — step through tip(50, 20)</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="stageBack()" [disabled]="stage() === 0" class="ghost">← Back</button>
          <button (click)="stageFwd()" [disabled]="stage() === callTrace.length - 1">Step →</button>
        </div>
        <div class="stages">
          @for (f of callTrace; track f.stage; let i = $index) {
            <span class="stage-chip" [class.on]="stage() === i" [class.done]="stage() > i">{{ f.stage }}</span>
          }
        </div>
        <div class="code" style="margin-top:10px"><pre>{{ callTrace[stage()].code }}</pre></div>
        <p style="font-size:.92rem">{{ callTrace[stage()].detail }}</p>
      </div>
      <div class="note">
        The step-4 mental model is the one to keep: <strong>a call is replaced by its
        return value</strong>. That's why you can nest calls —
        <code>double(double(3))</code> — the inner call collapses to 6, then the outer
        to 12. Complex expressions are just this rule applied repeatedly.
      </div>

      <h2>Try it — a tip calculator function</h2>
      <div class="demo">
        <p class="demo__title">Live — the same function, different inputs</p>
        <div class="field">
          <label>Bill amount</label>
          <input type="number" [value]="bill()" (input)="bill.set(+$any($event.target).value)" />
        </div>
        <div class="field">
          <label>Tip percent</label>
          <input type="number" [value]="percent()" (input)="percent.set(+$any($event.target).value)" />
        </div>
        <div class="code"><pre>function tip(bill, percent) {{ '{' }}
  return bill * (percent / 100);
{{ '}' }}

tip({{ bill() }}, {{ percent() }})   →   {{ tipAmount() }}
total = bill + tip({{ bill() }}, {{ percent() }})   →   {{ total() }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          One definition, endless calls. Notice the reuse on the total line — the same
          machine runs again rather than the math being written twice.
        </p>
      </div>

      <h2>Scope — what a function can see</h2>
      <div class="code"><pre>const taxRate = 0.2;              // OUTER scope

function priceWithTax(price) {{ '{' }}
  const tax = price * taxRate;    // ✅ can see outward: taxRate is visible
  return price + tax;
{{ '}' }}

priceWithTax(100);   // → 120
// console.log(tax);  ❌ error — "tax" exists only INSIDE the function</pre></div>
      <p>
        Variables declared inside a function (including its parameters) are
        <strong>local</strong>: created fresh at each call, invisible outside,
        destroyed when the call ends. The function <em>can</em> see outward to
        variables around it — visibility is one-way, inside-out. This is a feature:
        the function's internals can't leak out or collide with names elsewhere,
        which is what makes hundreds of functions coexist safely in one app.
      </p>

      <h2>The modern "arrow" style</h2>
      <div class="code"><pre>// classic:
function add(a, b) {{ '{' }} return a + b; {{ '}' }}

// arrow — read "=>" as "goes to". Same machine, terser suit:
const add = (a, b) => a + b;
//          └──┬──┘    └─┬─┘
//         parameters   single-expression body: its value
//                      is returned AUTOMATICALLY (no braces!)

// with braces you're back to writing return yourself:
const add2 = (a, b) => {{ '{' }}
  const sum = a + b;
  return sum;          // braces = full body = explicit return needed
{{ '}' }};

// one parameter may drop its parentheses:
const double = n => n * 2;</pre></div>
      <div class="warn">
        The classic slip: <code>(a, b) =&gt; {{ '{' }} a + b {{ '}' }}</code> returns
        <code>undefined</code> — the braces made it a full body, and nobody wrote
        <code>return</code>. Either drop the braces or add the return.
      </div>

      <h2>The superpower: functions are values</h2>
      <p>
        <code>const add = …</code> above already gave it away: a function can be
        stored in a variable. Which means it can also be <em>passed to another
        function</em> — and that flips the relationship: instead of you running it,
        you hand it over and <strong>someone else runs it later</strong>. A function
        passed around like this is called a <strong>callback</strong>:
      </p>
      <div class="code"><pre>const shout = (name) => name.toUpperCase() + '!';

// pass the FUNCTION ITSELF — note: no parentheses, we're not calling it
['ada', 'grace'].map(shout)      // ['ADA!', 'GRACE!'] — map calls it per item

button.addEventListener('click', onSave)  // browser calls it per click
setTimeout(ping, 2000)                    // timer calls it in 2 seconds

// ⚠️ the classic bug — parentheses call it NOW and pass the RESULT:
setTimeout(ping(), 2000)   // ping ran immediately; setTimeout got undefined</pre></div>
      <ul>
        <li><strong><code>shout</code> vs <code>shout()</code></strong> — the name is the machine; the parentheses press its button. When handing a callback over, you pass the machine, unpressed.</li>
        <li>Every <code>map</code>/<code>filter</code> from the last lesson was a callback all along — you supplied the per-item function; the array method did the looping and calling.</li>
        <li>Angular runs on this: <code>(click)="onSave()"</code> hands the framework a function to call on each click; RxJS, effects and route guards are callbacks end to end. Get comfortable passing functions and half the framework's API shapes become obvious.</li>
      </ul>

      <div class="note">
        Functions let you <strong>name an idea</strong>: <code>calculateTotal()</code>,
        <code>isLoggedIn()</code>, <code>sendEmail()</code>. A well-named function
        reads like a sentence and hides the messy details. Good programs are mostly
        small, well-named functions calling each other — Angular itself is thousands
        of them.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What does this print? <code>function f(x) {{ '{' }} return x * 2; console.log('hi'); {{ '}' }} f(3);</code></summary>
        <div>Nothing is printed (the call evaluates to 6). <code>return</code> ends
        the function immediately — the <code>console.log</code> line is unreachable
        code. Editors and linters flag code after a return for exactly this reason.</div>
      </details>
      <details class="qa">
        <summary>What's the difference between <code>setTimeout(ping, 1000)</code> and <code>setTimeout(ping(), 1000)</code>?</summary>
        <div>The first passes the function itself; the timer calls it after 1s —
        correct. The second <em>calls ping right now</em> and passes its return value
        (probably <code>undefined</code>) to the timer, so nothing happens later.
        Rule: a callback is passed without parentheses.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>const f = (n) =&gt; {{ '{' }} n + 1 {{ '}' }}; f(1)</code> give <code>undefined</code>?</summary>
        <div>The braces make a full function body, and full bodies only return what
        <code>return</code> states — there isn't one. Fix:
        <code>(n) =&gt; n + 1</code> (implicit return) or add
        <code>return n + 1;</code>.</div>
      </details>
      <details class="qa">
        <summary>Two calls run at once: <code>tip(50, 20)</code> and <code>tip(80, 10)</code>. Do their <code>bill</code> variables collide?</summary>
        <div>No — parameters and locals are created fresh <em>per call</em> and are
        invisible outside it. Each call gets its own private set of boxes. That
        isolation (scope) is why a function can be called from anywhere, even by
        itself, without stepping on other calls.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A function = parameters in → body runs → <code>return</code> out. Defining creates it; <em>calling</em> (parentheses) runs it; the call is replaced by its return value.</li>
        <li><code>return</code> also <strong>ends</strong> the function — later lines never run; no return means <code>undefined</code>.</li>
        <li>Locals and parameters exist per-call and are invisible outside (<strong>scope</strong>); functions see outward, never inward.</li>
        <li>Arrow style: <code>(a, b) =&gt; a + b</code> auto-returns; add braces and you must write <code>return</code> yourself.</li>
        <li>Functions are <strong>values</strong> — passing one (no parentheses!) as a <strong>callback</strong> is the pattern behind <code>map</code>, event handlers, timers, and most of Angular's API surface.</li>
      </ul>

      <p><a routerLink="/arrays-objects-basics">Next: Arrays &amp; Objects →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
     .field label { min-width: 110px; color: var(--text-muted); }

     .stages { display: flex; gap: 8px; flex-wrap: wrap; }
     .stage-chip { font-size: .78rem; border: 1px solid var(--border); border-radius: 999px; padding: 3px 12px; color: var(--text-muted); }
     .stage-chip.on { border-color: var(--accent); color: var(--text); font-weight: 600; }
     .stage-chip.done { border-color: var(--green); }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class FunctionsBasics {
  protected readonly bill = signal(50);
  protected readonly percent = signal(18);
  protected readonly tipAmount = computed(() => (this.bill() * this.percent()) / 100);
  protected readonly total = computed(() => this.bill() + this.tipAmount());

  protected readonly callTrace = CALL_TRACE;
  protected readonly stage = signal(0);
  protected stageFwd() {
    this.stage.update((s) => Math.min(s + 1, this.callTrace.length - 1));
  }
  protected stageBack() {
    this.stage.update((s) => Math.max(s - 1, 0));
  }
}
