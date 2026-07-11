import { DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Types, annotations & inference — primitives/tuples, how inference
 * and widening actually decide a type (live explorer), any/unknown/never/void
 * with the "any spreads" trap, unions + discriminated unions with exhaustive
 * checking (live), structural typing's surprises, and assertion discipline.
 */

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

interface InferCase {
  code: string;
  inferred: string;
  why: string;
}

const INFER_CASES: InferCase[] = [
  {
    code: `let count = 0;`,
    inferred: 'number',
    why: 'let means "this may be reassigned", so TS WIDENS the literal 0 to the whole number type — any future number is allowed.',
  },
  {
    code: `const role = 'admin';`,
    inferred: `'admin'`,
    why: `const can never be reassigned, so TS keeps the narrowest possible type: the literal 'admin' itself. Not string — exactly 'admin'. This is why const values slot perfectly into unions like 'admin' | 'user'.`,
  },
  {
    code: `let role = 'admin';`,
    inferred: 'string',
    why: `Same value, but let ⇒ widening: 'admin' becomes string. If a function expects 'admin' | 'user', passing this variable is now a compile error — a classic confusion solved by const or a type annotation.`,
  },
  {
    code: `const nums = [1, 2, 3];`,
    inferred: 'number[]',
    why: 'const prevents REASSIGNING nums, but the array contents stay mutable (push/pop) — so TS widens the elements to number[] rather than the tuple [1, 2, 3].',
  },
  {
    code: `const theme = { primary: '#dd0031' } as const;`,
    inferred: `{ readonly primary: '#dd0031' }`,
    why: 'as const freezes the whole value into its narrowest, deeply-readonly form: properties become readonly and every value keeps its literal type. The go-to for config objects and building unions from data.',
  },
  {
    code: `const done = null;`,
    inferred: 'null (or any, pre-strict)',
    why: 'Initializing with null gives TS nothing to widen to — annotate these explicitly: const done: boolean | null = null. Inference is only as good as the evidence you give it.',
  },
];

@Component({
  selector: 'app-lesson-ts-types',
  imports: [RouterLink, DecimalPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Types, Annotations &amp; Inference</h1>
      <p class="lead">
        TypeScript adds a static type layer on top of JavaScript. Angular is written
        in TypeScript and its tooling (templates included) is fully type-checked, so
        a solid grasp of types is non-negotiable. Two facts frame everything on this
        page: types are <strong>erased at build time</strong> (they guide the
        compiler and editor, but ship no code), and TypeScript checks
        <strong>shape, not names</strong> — a fact with surprising consequences we'll
        get to.
      </p>

      <h2>Primitives &amp; annotations</h2>
      <p>An annotation is <code>: Type</code> after a name — a claim the compiler will hold you to:</p>
      <div class="code"><pre>let name: string = 'Ada';
let age: number = 36;              // all numbers are floats; no int/float split
let active: boolean = true;
let big: bigint = 9007199254740993n;   // beyond number's safe range (2^53)
let sym: symbol = Symbol('id');
let nothing: null = null;
let missing: undefined = undefined;

let ids: number[] = [1, 2, 3];     // same as Array&lt;number&gt;
let pair: [string, number] = ['a', 1];         // tuple: fixed length AND per-slot type
let rest: [string, ...number[]] = ['x', 1, 2]; // tuple with a rest element
function log(msg: string): void {{ '{' }} console.log(msg); {{ '}' }}</pre></div>
      <ul>
        <li><code>number[]</code> and <code>Array&lt;number&gt;</code> are identical — pick one style and stay consistent.</li>
        <li>Tuples fix both <strong>length</strong> and <strong>per-position type</strong> — <code>pair[2]</code> is a compile error. Labels (<code>[x: number, y: number]</code>) are pure documentation but make signatures readable.</li>
        <li><code>readonly number[]</code> / <code>readonly [string, number]</code> forbid mutation — <code>push</code> simply doesn't exist on the readonly type. Prefer readonly for anything you hand out of a service.</li>
      </ul>

      <h2>Inference &amp; widening — how TS decides when you don't say</h2>
      <p>
        You rarely annotate initialized variables; TypeScript <em>infers</em> from
        the initializer. But the rules have a twist — <code>let</code> and
        <code>const</code> infer <strong>differently</strong>, and knowing why saves
        you from a whole family of confusing errors. Step through real cases:
      </p>
      <div class="demo">
        <p class="demo__title">Live — what does TS infer here?</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (c of inferCases; track c.code; let i = $index) {
            <button [class.ghost]="inferIdx() !== i" (click)="inferIdx.set(i)">case {{ i + 1 }}</button>
          }
        </div>
        <div class="code"><pre>{{ inferCases[inferIdx()].code }}
// hover-type: {{ inferCases[inferIdx()].inferred }}</pre></div>
        <p style="font-size:.92rem">{{ inferCases[inferIdx()].why }}</p>
      </div>
      <div class="tip">
        The professional dosage: annotate <strong>function parameters</strong> (inference
        has nothing to infer from), <strong>return types of public APIs</strong> (locks
        the contract — an accidental change becomes an error <em>inside</em> the
        function instead of rippling to every caller), and anything inference gets
        wrong (null initializers). Let inference handle local variables —
        over-annotating is noise that can even mask better inferred types.
      </div>

      <h2>any vs unknown vs never vs void</h2>
      <table class="t">
        <tr><td><code>any</code></td><td>Opt out of checking entirely. Assignable to and from everything — and <strong>contagious</strong>: every value that touches an <code>any</code> computation becomes <code>any</code> too. One <code>any</code> API can silently de-type a whole call chain.</td></tr>
        <tr><td><code>unknown</code></td><td>The top type: holds anything, but you must <strong>narrow</strong> (typeof / instanceof / guards) before using it. Same flexibility as <code>any</code> at the boundary, none of the contagion.</td></tr>
        <tr><td><code>never</code></td><td>The bottom type: no value can be assigned to it. Returned by functions that never finish (throw / infinite loop); used to make the compiler <em>prove</em> exhaustiveness (below).</td></tr>
        <tr><td><code>void</code></td><td>"No useful return value." Subtlety: a <code>() =&gt; void</code> callback is <em>allowed</em> to return something — the type just promises nobody will read it. That's why <code>arr.forEach(x =&gt; list.push(x))</code> compiles even though push returns a number.</td></tr>
      </table>
      <div class="code"><pre>// the boundary pattern — how untyped data should enter a typed program:
function parse(json: string): unknown {{ '{' }}   // ← unknown, NOT any
  return JSON.parse(json);
{{ '}' }}

const data = parse('…');
// data.name;                    ❌ Object is of type 'unknown' — good! it made you check
if (typeof data === 'object' && data !== null && 'name' in data) {{ '{' }}
  // narrowed step by step — safe to use here
{{ '}' }}</pre></div>
      <p>
        Line-by-line: <code>JSON.parse</code> officially returns <code>any</code> —
        re-declaring the return as <code>unknown</code> stops the contagion at the
        door. The <code>if</code> narrows in three moves: it's an object, it's not
        null (typeof null === 'object' — the language's oldest wart), and it has the
        key. Each check teaches the compiler something; after all three, property
        access is proven safe.
      </p>

      <h2>Union &amp; literal types — modelling finite states</h2>
      <div class="code"><pre>type Level = 'beginner' | 'intermediate' | 'expert';
let lvl: Level = 'beginner';   // ✅
// lvl = 'wizard';             // ❌ compile error — a typo caught at build time

type Status = 200 | 404 | 500;            // numeric literals work too
type Nullable&lt;T&gt; = T | null | undefined;  // unions compose with anything</pre></div>
      <p>
        A union (<code>|</code>) says "one of these"; a literal type shrinks a value
        to exact constants. Together they turn stringly-typed chaos
        (<code>status: string</code>) into checked vocabularies — misspell one state
        anywhere in the codebase and the build fails. This one habit eliminates a
        startling fraction of production bugs.
      </p>

      <h2>Discriminated unions — the pattern Angular state lives on</h2>
      <p>
        Give every union member a shared literal field (the <em>discriminant</em>,
        here <code>kind</code>) and TypeScript can tell them apart at runtime checks:
      </p>
      <div class="code"><pre>type Shape =
  | {{ '{' }} kind: 'circle'; radius: number {{ '}' }}            // ← 'circle' is a literal type,
  | {{ '{' }} kind: 'rect'; width: number; height: number {{ '}' }}; //   not string — that's the key

function area(s: Shape): number {{ '{' }}
  switch (s.kind) {{ '{' }}
    case 'circle': return Math.PI * s.radius ** 2;  // s is the circle branch here:
                                                    //   radius exists, width doesn't
    case 'rect':   return s.width * s.height;       // and here it's the rect branch
    default:
      const _exhaustive: never = s;   // s should be nothing by now. If a
      return _exhaustive;             // 'triangle' is added to Shape later, s is
  {{ '}' }}                                   // no longer never → COMPILE ERROR here.
{{ '}' }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — the union narrowing, running</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="shape.set({ kind: 'circle', radius: 5 })">circle</button>
          <button (click)="shape.set({ kind: 'rect', width: 4, height: 6 })">rectangle</button>
        </div>
        <p>shape = <code>{{ describe() }}</code></p>
        <p>area = <strong>{{ area() | number: '1.0-2' }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          The component's <code>area()</code> is that exact switch. Inside each case,
          the editor's autocomplete offers only that branch's properties — narrowing
          is an editor feature, not just a checker feature.
        </p>
      </div>
      <p>
        The <code>never</code> trick deserves its own sentence: it converts "I forgot
        to handle a case" from a runtime mystery into a build failure <em>at the
        exact line that needs the new case</em>. Model loading/error/success states
        this way (<code>{{ '{' }}status: 'loading'{{ '}' }} | {{ '{' }}status: 'error'; msg{{ '}' }} | …</code>)
        and impossible states — error message during success — become
        unrepresentable.
      </p>

      <h2>Structural typing — compatibility by shape</h2>
      <div class="code"><pre>interface Point {{ '{' }} x: number; y: number; {{ '}' }}
interface Coord {{ '{' }} x: number; y: number; {{ '}' }}

const p: Point = {{ '{' }} x: 1, y: 2 {{ '}' }};
const c: Coord = p;              // ✅ never heard of each other — same shape, compatible

const labeled = {{ '{' }} x: 1, y: 2, label: 'home' {{ '}' }};
const p2: Point = labeled;       // ✅ EXTRA properties are fine via a variable…
// const p3: Point = {{ '{' }} x: 1, y: 2, label: 'home' {{ '}' }};
//                              ❌ …but not as a fresh literal ("excess property check")</pre></div>
      <p>
        TypeScript is <strong>structural</strong> ("duck typing"): names are
        irrelevant, members are everything. The two behaviours to internalize: a
        value with <em>more</em> than required is normally acceptable (that's how
        interfaces stay flexible), yet object <em>literals</em> get a stricter
        excess-property check — because a literal with an extra key is almost always
        a typo'd optional property, and TS chooses to catch it right there.
      </p>

      <h2>Assertions — overriding the compiler (rarely, consciously)</h2>
      <div class="code"><pre>const el = document.querySelector('input') as HTMLInputElement;
//   querySelector returns Element | null — "as" says: trust me, it's an input.
//   If you're wrong, there is NO runtime check. It crashes later, elsewhere.

const value = el!.value;
//              ^ non-null assertion: "not null here, promise." Same deal: unchecked.

const config = {{ '{' }} retries: 3 {{ '}' }} satisfies Record&lt;string, number&gt;;
//   satisfies = the safe cousin: VALIDATES the value against the type
//   but keeps the narrow inferred type ({{ '{' }} retries: number {{ '}' }}) for later use.</pre></div>
      <div class="warn">
        Discipline order: <strong>narrow first</strong> (if/typeof/guards — checked
        at runtime), <strong>satisfies</strong> when you only need validation,
        <strong>as / !</strong> last — and each one should carry a comment saying
        <em>why</em> it's safe. An <code>as</code> is a promissory note the runtime
        never audits; codebases where they're routine have traded TypeScript back
        for JavaScript with extra steps.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does <code>let method = 'GET'; fetch(url, {{ '{' }} method {{ '}' }})</code> sometimes error while inlining <code>'GET'</code> works?</summary>
        <div>Widening: <code>let</code> turned <code>'GET'</code> into
        <code>string</code>, but the option expects a union of methods. Fixes:
        <code>const method = 'GET'</code> (keeps the literal),
        <code>let method: 'GET' | 'POST'</code>, or <code>'GET' as const</code>.
        Same story for any "string is not assignable to '…' | '…'" error.</div>
      </details>
      <details class="qa">
        <summary>An API function returns <code>any</code>. What's the cheapest containment?</summary>
        <div>Wrap it: assign the result to <code>unknown</code> (or declare your
        wrapper's return type explicitly), then narrow once, centrally. The point is
        to stop the contagion at one boundary instead of letting <code>any</code>
        seep through every caller. Enable <code>noImplicitAny</code> so new leaks at
        least announce themselves.</div>
      </details>
      <details class="qa">
        <summary>What breaks when a teammate adds <code>'triangle'</code> to the <code>Shape</code> union — and where?</summary>
        <div>Every switch with the <code>never</code>-exhaustiveness default fails to
        compile at the <code>_exhaustive</code> line — a precise to-do list of every
        place that must now handle triangles. Without the trick: silent fall-through
        to default behaviour at runtime, discovered by users.</div>
      </details>
      <details class="qa">
        <summary>True or false: <code>as HTMLInputElement</code> converts the element for you.</summary>
        <div>False — assertions perform <em>zero</em> runtime work; they only change
        what the compiler believes. If the element is actually a div (or null), the
        code compiles and then explodes on <code>.value</code> at runtime. Contrast
        with narrowing (<code>if (el instanceof HTMLInputElement)</code>), which
        really checks.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Types are erased at build time. Annotate parameters and public returns; let inference cover locals.</li>
        <li><code>let</code> widens (<code>'admin'</code> → <code>string</code>), <code>const</code> keeps literals, <code>as const</code> freezes deeply — the cause of (and fix for) most "string is not assignable to …" errors.</li>
        <li>Boundary pattern: <code>unknown</code> in, narrow once, typed everywhere after. Never let <code>any</code> in the front door — it spreads.</li>
        <li>Discriminated unions + switch narrowing + a <code>never</code> default = states that can't be misspelled, mixed, or forgotten.</li>
        <li>Typing is structural (shape over names, with the excess-property check on fresh literals); <code>as</code>/<code>!</code> are unchecked promises — narrow first, <code>satisfies</code> second, assert last.</li>
      </ul>

      <p><a routerLink="/ts-generics">Next: Generics →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 120px; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Types {
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });

  protected readonly inferCases = INFER_CASES;
  protected readonly inferIdx = signal(0);

  protected readonly area = computed(() => {
    const s = this.shape();
    switch (s.kind) {
      case 'circle':
        return Math.PI * s.radius ** 2;
      case 'rect':
        return s.width * s.height;
    }
  });

  protected describe(): string {
    const s = this.shape();
    return s.kind === 'circle' ? `circle r=${s.radius}` : `rect ${s.width}×${s.height}`;
  }
}
