import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Programming basics — values, types, variables, operators,
 * expressions vs statements, how the computer executes line by line,
 * and the classic beginner traps (= vs ===, string '5' vs number 5,
 * copy vs reference preview). Zero prior knowledge assumed.
 */

interface TraceLine {
  code: string;
  effect: string;
  boxes: { name: string; value: string }[];
}

/** A tiny program traced line by line — the "computer's eye view". */
const TRACE: TraceLine[] = [
  {
    code: `let price = 20;`,
    effect: 'Create a box named "price" and put the number 20 in it.',
    boxes: [{ name: 'price', value: '20' }],
  },
  {
    code: `let qty = 3;`,
    effect: 'Create a second box, "qty", holding 3. "price" is untouched.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '3' },
    ],
  },
  {
    code: `let total = price * qty;`,
    effect:
      'The RIGHT side runs first: look inside price (20) and qty (3), multiply → 60. Only then is the result stored in a new box "total". The boxes it read are not changed.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '3' },
      { name: 'total', value: '60' },
    ],
  },
  {
    code: `qty = 4;`,
    effect:
      'Replace the contents of "qty" with 4. Important: "total" is STILL 60 — line 3 already ran. Variables do not stay linked to the formula that produced them; a program is steps in time, not a spreadsheet.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '4' },
      { name: 'total', value: '60 (!)' },
    ],
  },
  {
    code: `total = price * qty;`,
    effect:
      'To refresh total you must run the calculation AGAIN. Now the right side reads 20 and 4 → 80, and that replaces the 60.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '4' },
      { name: 'total', value: '80' },
    ],
  },
];

@Component({
  selector: 'app-lesson-programming-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Programming Basics: Values &amp; Variables</h1>
      <p class="lead">
        Programming is writing instructions for a computer to follow, <em>one at a
        time, top to bottom</em>. Those instructions almost always work with
        <strong>values</strong> — pieces of information — stored in
        <strong>variables</strong>. This page builds those two ideas properly, shows
        you how the computer actually walks through a program, and defuses the traps
        that bite every beginner.
      </p>

      <h2>What is a value — and why its <em>type</em> matters</h2>
      <p>A value is a single piece of data. The everyday kinds you'll use constantly:</p>
      <table class="t">
        <tr><td><strong>Number</strong></td><td><code>42</code>, <code>3.14</code>, <code>-7</code> — for counting and math. No quotes.</td></tr>
        <tr><td><strong>String</strong></td><td><code>'Ada'</code>, <code>'hello world'</code>, even <code>'42'</code> — text, always inside quotes. The quotes are how you (and the computer) know it's text.</td></tr>
        <tr><td><strong>Boolean</strong></td><td><code>true</code> or <code>false</code> — a yes/no answer. Named after logician George Boole. Every decision a program makes boils down to one of these.</td></tr>
        <tr><td><strong>undefined / null</strong></td><td>"Nothing here." <code>undefined</code> = never given a value; <code>null</code> = deliberately empty. You'll meet both constantly in real code.</td></tr>
      </table>
      <p>
        The <em>kind</em> of a value is called its <strong>type</strong>, and it decides
        what operations mean. Watch the same <code>+</code> do two different jobs:
      </p>
      <div class="code"><pre>5 + 5        // 10        numbers → addition
'5' + '5'    // '55'      strings → gluing (concatenation)
'5' + 5      // '55' (!)  mixed → JavaScript converts the number to text and glues</pre></div>
      <p>
        That last line is a real bug factory: a value read from an input field is
        <em>always a string</em>, so <code>ageFromInput + 1</code> gives
        <code>'361'</code> instead of <code>37</code>. This whole class of surprise is
        why the next lessons introduce <strong>TypeScript</strong>, which flags mixed-type
        mistakes <em>before</em> the code ever runs. Try it yourself:
      </p>
      <div class="demo">
        <p class="demo__title">Live — the same + with different types</p>
        <div class="field">
          <label>left value</label>
          <input [value]="left()" (input)="left.set($any($event.target).value)" style="width:110px" />
          <label class="mini">treat as</label>
          <button [class.ghost]="!leftIsNum()" (click)="leftIsNum.set(true)">number</button>
          <button [class.ghost]="leftIsNum()" (click)="leftIsNum.set(false)">string</button>
        </div>
        <div class="field">
          <label>right value</label>
          <input [value]="right()" (input)="right.set($any($event.target).value)" style="width:110px" />
          <label class="mini">treat as</label>
          <button [class.ghost]="!rightIsNum()" (click)="rightIsNum.set(true)">number</button>
          <button [class.ghost]="rightIsNum()" (click)="rightIsNum.set(false)">string</button>
        </div>
        <div class="code"><pre>{{ plusExpr() }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Same operator, different types, different meaning. When either side is a
          string, + becomes "glue".
        </p>
      </div>

      <h2>What is a variable?</h2>
      <p>
        A variable is a <strong>labelled box</strong> that holds a value so you can use
        it later by name. You create ("declare") one with <code>let</code> or
        <code>const</code>:
      </p>
      <div class="code"><pre>let score = 0;       // "let": a box whose contents may be replaced later
const name = 'Ada';  // "const": a box that is sealed after the first value

score = 10;          // ✅ allowed — let can be reassigned
// name = 'Grace';   // ❌ error — const cannot be reassigned</pre></div>
      <p>Reading the first line the way the computer does, right side first:</p>
      <ul>
        <li><code>let score</code> — "make a new box and label it <em>score</em>".</li>
        <li><code>= 0</code> — "put the value <code>0</code> into it". The <code>=</code> does <strong>not</strong> mean "equals" like in maths — it means <em>"store the right side into the left side"</em>. We call that <strong>assignment</strong>, and it always flows right → left.</li>
        <li><code>;</code> — "this instruction is finished". Like a full stop in a sentence.</li>
      </ul>
      <div class="tip">
        <strong>Default to <code>const</code>.</strong> Professional code uses
        <code>const</code> for almost everything and <code>let</code> only when a value
        genuinely must change (a counter, a running total). A sealed box is one less
        thing that can go wrong — if you try to overwrite it, the mistake announces
        itself immediately instead of corrupting data silently.
      </div>

      <h2>The computer's eye view — step through a program</h2>
      <p>
        This is the single most useful skill on this page: being able to
        <strong>trace</strong> code — play computer, one line at a time, tracking what
        every box holds. Step through this five-line program and watch the boxes:
      </p>
      <div class="demo">
        <p class="demo__title">Live — execute one line at a time</p>
        <div class="trace-code">
          @for (line of trace; track line.code; let i = $index) {
            <div class="tline" [class.done]="lineNo() > i" [class.now]="lineNo() === i" (click)="lineNo.set(i)">
              <span class="ln">{{ i + 1 }}</span><code>{{ line.code }}</code>
            </div>
          }
        </div>
        <div class="row" style="margin:10px 0">
          <button (click)="stepBack()" [disabled]="lineNo() === 0" class="ghost">← Back</button>
          <button (click)="stepFwd()" [disabled]="lineNo() === trace.length - 1">Step →</button>
        </div>
        <p style="font-size:.92rem"><strong>What line {{ lineNo() + 1 }} does:</strong> {{ trace[lineNo()].effect }}</p>
        <div class="boxes">
          @for (b of trace[lineNo()].boxes; track b.name) {
            <div class="box"><span class="box-name">{{ b.name }}</span><span class="box-val">{{ b.value }}</span></div>
          }
        </div>
      </div>
      <div class="warn">
        Line 4 is the big lesson: after <code>qty = 4</code>, <code>total</code> is
        <em>still 60</em>. A variable holds the <strong>result</strong> of a
        calculation, not the calculation itself — code is a sequence of moments, not a
        spreadsheet of live formulas. (Angular's <em>signals</em>, which you'll meet
        soon, exist precisely to give you the spreadsheet behaviour when you want it —
        <code>computed()</code> re-runs automatically. Now you'll understand why that's
        special.)
      </div>

      <h2>Doing things with values — operators</h2>
      <div class="code"><pre>// arithmetic on numbers:
2 + 3        // 5
10 - 4       // 6
6 * 7        // 42
20 / 4       // 5
7 % 3        // 1     ← "modulo": the REMAINDER after division (7 = 2×3 + 1)

// comparisons — each produces a boolean (true/false):
5 > 3        // true
5 >= 5       // true
5 === 5      // true   "exactly equal to"
5 !== 4      // true   "not equal to"

// combining booleans:
true && false   // false  — && is AND: both sides must be true
true || false   // true   — || is OR: at least one side true
!true           // false  — ! flips it: NOT</pre></div>
      <ul>
        <li><code>%</code> (modulo) looks exotic but is everywhere: <code>n % 2 === 0</code> is the classic "is n even?" test — a number is even exactly when dividing by 2 leaves remainder 0.</li>
        <li>Comparisons don't <em>do</em> anything by themselves — they <em>produce a boolean</em> that you then store or hand to an <code>if</code> (next lesson) to make a decision.</li>
        <li><code>&amp;&amp;</code> / <code>||</code> / <code>!</code> let you build compound questions: <em>"is the user logged in AND is the cart non-empty?"</em></li>
      </ul>

      <div class="note">
        <strong><code>=</code> vs <code>===</code> — completely different jobs.</strong>
        One equals sign <em>assigns</em> ("put this into the box"). Three equals signs
        <em>compare</em> ("are these the same?") and hand back <code>true</code> or
        <code>false</code>. You'll also see <code>==</code> (two) in old code — it
        compares <em>after</em> silently converting types (<code>'5' == 5</code> is
        <code>true</code>!), which causes so many surprises that modern style bans it.
        Always <code>===</code>.
      </div>

      <h2>Naming things — a professional habit from day one</h2>
      <div class="code"><pre>// ❌ legal, but cruel to the next reader (probably you, next week):
const x = 86400;

// ✅ the name carries the meaning:
const secondsPerDay = 86400;

// convention in JavaScript/TypeScript: camelCase —
// first word lowercase, every following word capitalized:
let itemsInCart = 3;
const maxRetryCount = 5;</pre></div>
      <p>
        Code is read far more often than it is written. A good variable name is a tiny
        piece of documentation that never goes stale — you will see this principle
        enforced through every lesson in this course.
      </p>

      <h2>Comments — notes for humans</h2>
      <div class="code"><pre>// anything after two slashes is a comment — the computer ignores it.
let total = 5; // they can also sit at the end of a line

/* a slash-star pair makes a comment
   that can span several lines */</pre></div>
      <p>
        Best practice you'll see in this codebase: comment the <em>why</em>, not the
        <em>what</em>. <code>// add 1 to i</code> restates the obvious;
        <code>// cart prices arrive as strings from the API</code> saves the reader an
        investigation.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What does <code>let x = 5; let y = x; x = 10;</code> leave in <code>y</code>?</summary>
        <div><code>y</code> is <strong>5</strong>. Line 2 <em>copied the value</em> out
        of x's box into y's box; the boxes are independent afterwards, so line 3 only
        changes x. (Later you'll learn objects behave differently — two variables can
        share one object — but for numbers, strings and booleans, assignment copies.)</div>
      </details>
      <details class="qa">
        <summary>Why does <code>'10' + 5</code> give <code>'105'</code> but <code>'10' - 5</code> give <code>5</code>?</summary>
        <div><code>+</code> has two jobs — if either side is a string it glues, so the
        5 becomes '5' and you get '105'. <code>-</code> has only one job (math), so
        JavaScript converts '10' to a number instead. Inconsistent? Absolutely — which
        is why TypeScript will simply refuse to compile the mixed versions.</div>
      </details>
      <details class="qa">
        <summary><code>if (score = 100)</code> — spot the bug.</summary>
        <div>Single <code>=</code>: it <em>assigns</em> 100 into score (destroying its
        value!) instead of comparing. The intended code is
        <code>if (score === 100)</code>. This bug is legal JavaScript and runs without
        error — the condition just becomes the assigned value. TypeScript and linters
        flag it, which is one more reason they exist.</div>
      </details>
      <details class="qa">
        <summary>When must you use <code>let</code> instead of <code>const</code>?</summary>
        <div>Only when the variable will be <em>reassigned</em>: counters
        (<code>i = i + 1</code>), running totals, values built up across steps.
        Everything else should be <code>const</code>. Note the subtlety: const seals
        the <em>box</em>, not the value — a const object's insides can still change
        (that nuance returns in the Arrays &amp; Objects lesson).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A <strong>value</strong> is a piece of data; its <strong>type</strong> (number, string, boolean…) decides what operations mean — <code>5 + 5</code> ≠ <code>'5' + '5'</code>.</li>
        <li>A <strong>variable</strong> is a named box. <code>const</code> = sealed (use by default), <code>let</code> = replaceable. Assignment flows right → left.</li>
        <li>Programs run <strong>one line at a time</strong>; a variable holds the result of a past calculation, and won't update unless you recalculate. Tracing code line-by-line is a learnable superpower.</li>
        <li><code>=</code> assigns, <code>===</code> compares, <code>==</code> is a legacy trap — never use it.</li>
        <li>Name variables for meaning in <strong>camelCase</strong>; comment the <em>why</em>.</li>
      </ul>

      <p><a routerLink="/functions-basics">Next: Functions →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; }
     .field { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
     .field label { min-width: 80px; color: var(--text-muted); }
     .field .mini { min-width: 0; font-size: .8rem; }

     .trace-code { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; font-size: .88rem; }
     .tline { display: flex; gap: 12px; padding: 6px 12px; cursor: pointer; border-bottom: 1px solid var(--border); }
     .tline:last-child { border-bottom: none; }
     .tline .ln { color: var(--text-muted); width: 16px; text-align: right; }
     .tline.done { opacity: .55; }
     .tline.now { background: rgba(99, 102, 241, .12); border-left: 3px solid var(--accent); }

     .boxes { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
     .box { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; min-width: 90px; text-align: center; }
     .box-name { display: block; font-size: .72rem; padding: 3px 10px; background: var(--bg-elevated); color: var(--text-muted); font-family: monospace; }
     .box-val { display: block; padding: 6px 10px; font-family: monospace; font-weight: 700; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class ProgrammingBasics {
  protected readonly trace = TRACE;
  protected readonly lineNo = signal(0);

  protected readonly left = signal('5');
  protected readonly right = signal('5');
  protected readonly leftIsNum = signal(true);
  protected readonly rightIsNum = signal(true);

  /** Renders the + expression with true JS semantics for the chosen types. */
  protected readonly plusExpr = computed(() => {
    const l: string | number = this.leftIsNum() ? Number(this.left()) || 0 : this.left();
    const r: string | number = this.rightIsNum() ? Number(this.right()) || 0 : this.right();
    const show = (v: string | number) => (typeof v === 'string' ? `'${v}'` : String(v));
    // `as never` keeps TS happy about the intentionally-mixed addition we're demonstrating
    const result = (l as never as number) + (r as never as number);
    return `${show(l)} + ${show(r)}   →   ${show(result)}   (${typeof result})`;
  });

  protected stepFwd() {
    this.lineNo.update((n) => Math.min(n + 1, this.trace.length - 1));
  }
  protected stepBack() {
    this.lineNo.update((n) => Math.max(n - 1, 0));
  }
}
