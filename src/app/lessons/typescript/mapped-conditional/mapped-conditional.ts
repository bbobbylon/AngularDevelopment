import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Mapped & conditional types — the type-level programming model
 * (types as functions over types), mapped-type anatomy piece by piece, key
 * remapping and filtering, conditional types + infer with a live evaluator,
 * distribution over unions (and how to switch it off), template literals,
 * and rebuilding the standard utility types from scratch.
 */

interface EvalCase {
  label: string;
  expr: string;
  steps: string[];
  result: string;
}

const EVAL_CASES: EvalCase[] = [
  {
    label: `Partial<User>`,
    expr: `type User = { id: number; name: string };
type Partial<T> = { [K in keyof T]?: T[K] };

Partial<User> = ?`,
    steps: [
      `keyof User → 'id' | 'name' — the union of key names.`,
      `[K in keyof T] loops: first K = 'id', then K = 'name' — like a for...of over keys, at the type level.`,
      `For K = 'id': the ? modifier makes it optional, T[K] looks up its value type → id?: number.`,
      `For K = 'name': same → name?: string.`,
    ],
    result: `{ id?: number; name?: string }`,
  },
  {
    label: `IsString<42>`,
    expr: `type IsString<T> = T extends string ? 'yes' : 'no';

IsString<'hi'> = ?
IsString<42>  = ?`,
    steps: [
      `"T extends string" asks: is T assignable to string?`,
      `'hi' is a string literal → assignable → take the true branch → 'yes'.`,
      `42 is a number → not assignable → false branch → 'no'.`,
      `That's the whole idea: a conditional type is an if/else that runs in the compiler.`,
    ],
    result: `IsString<'hi'> = 'yes'   ·   IsString<42> = 'no'`,
  },
  {
    label: `Unwrap<Promise<User>>`,
    expr: `type Unwrap<T> = T extends Promise<infer V> ? V : T;

Unwrap<Promise<User>> = ?
Unwrap<number>        = ?`,
    steps: [
      `"T extends Promise<infer V>" tries to MATCH T against the pattern Promise<something>.`,
      `Promise<User> matches — and infer V captures the something: V = User. True branch returns V.`,
      `number doesn't match the pattern → false branch returns T unchanged → number.`,
      `infer = destructuring for types: name a part of a matched pattern, then use it. This is exactly how the built-in Awaited<T> and ReturnType<T> work.`,
    ],
    result: `Unwrap<Promise<User>> = User   ·   Unwrap<number> = number`,
  },
  {
    label: `Exclude<'a'|'b'|'c', 'b'>`,
    expr: `type Exclude<T, U> = T extends U ? never : T;

Exclude<'a' | 'b' | 'c', 'b'> = ?`,
    steps: [
      `KEY RULE: when T is a bare type parameter and you feed it a union, the conditional runs on EACH MEMBER separately ("distribution").`,
      `'a' extends 'b' ? → no → 'a' survives.`,
      `'b' extends 'b' ? → yes → never (never = "nothing" — it vanishes from a union).`,
      `'c' extends 'b' ? → no → 'c' survives. Reassemble: 'a' | never | 'c' = 'a' | 'c'.`,
    ],
    result: `'a' | 'c'`,
  },
];

@Component({
  selector: 'app-lesson-ts-mapped-conditional',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Advanced Types</span>
      <h1>Mapped &amp; Conditional Types</h1>
      <p class="lead">
        Here's the mental shift this lesson asks of you: TypeScript's type system is
        itself a <strong>small programming language</strong> that runs inside the
        compiler. It has loops over keys (mapped types), if/else (conditional
        types), pattern-matching variables (<code>infer</code>), and string
        interpolation (template literal types). Every utility type you used in the
        previous lesson — <code>Partial</code>, <code>Pick</code>,
        <code>ReturnType</code> — is a short program in this language, and by the end
        of this page you can write all of them from scratch.
      </p>

      <h2>Mapped types — a loop over keys</h2>
      <p>The anatomy, one piece at a time:</p>
      <div class="code"><pre>type Optional&lt;T&gt; = {{ '{' }} [K in keyof T]?: T[K] {{ '}' }};
                     │  │      │        │   └── value: look up K's original type
                     │  │      │        └── the ? modifier: make each key optional
                     │  │      └── keyof T = union of T's key names
                     │  └── K takes each key in turn — the loop variable
                     └── [K in …] is the mapped-type syntax itself</pre></div>
      <p>
        Read it aloud: <em>"for every key K of T, produce an optional property K
        whose type is whatever T had at K."</em> That's <code>Partial&lt;T&gt;</code>,
        the real one — the standard library's version is literally this line. The
        modifiers can also be <em>removed</em> with a minus sign:
      </p>
      <div class="code"><pre>type Required2&lt;T&gt; = {{ '{' }} [K in keyof T]-?: T[K] {{ '}' }};          // -? strips optionality
type Mutable&lt;T&gt;   = {{ '{' }} -readonly [K in keyof T]: T[K] {{ '}' }};  // -readonly strips readonly
type Frozen&lt;T&gt;    = {{ '{' }} readonly [K in keyof T]: T[K] {{ '}' }};   // ≈ Readonly&lt;T&gt;</pre></div>

      <h2>Key remapping — rename or drop keys with <code>as</code></h2>
      <div class="code"><pre>// rename: build getter names out of property names
type Getters&lt;T&gt; = {{ '{' }}
  [K in keyof T as \`get\${{ '{' }}Capitalize&lt;string &amp; K&gt;{{ '}' }}\`]: () => T[K]
{{ '}' }};
// Getters<{{ '{' }}name: string{{ '}' }}>  →  {{ '{' }} getName: () => string {{ '}' }}

// drop: remapping a key to never DELETES it — that's property filtering:
type Methods&lt;T&gt; = {{ '{' }}
  [K in keyof T as T[K] extends Function ? K : never]: T[K]
{{ '}' }};
// keeps only the keys whose VALUE type is a function</pre></div>
      <ul>
        <li><code>as</code> after the loop variable rewrites the key. The template literal builds the new name; <code>string &amp; K</code> is a formality that drops rare symbol keys so Capitalize gets a string.</li>
        <li>The <code>never</code>-drop idiom is the type-level <code>filter()</code> — it combines a mapped type (the loop) with a conditional type (the test), which is your cue for the next section.</li>
      </ul>

      <h2>Conditional types — if/else in the compiler</h2>
      <div class="code"><pre>type IsString&lt;T&gt; = T extends string ? 'yes' : 'no';
//                 └────── the test ──────┘  └ true ┘ └ false ┘
type A = IsString<'hi'>;   // 'yes'
type B = IsString<42>;     // 'no'</pre></div>
      <p>
        <code>extends</code> here means <strong>"is assignable to"</strong> — the
        same compatibility question the checker asks at every assignment, now used as
        a branch condition. And <code>infer</code> adds pattern-matching: name a part
        of the matched shape and reuse it in the true branch:
      </p>
      <div class="code"><pre>type ElementType&lt;T&gt; = T extends (infer U)[] ? U : T;
//                              └── "if T matches the pattern something[],
//                                   call that something U and return it"
type C = ElementType&lt;number[]&gt;;    // number

type Unwrap&lt;T&gt;     = T extends Promise&lt;infer V&gt; ? V : T;   // how Awaited works
type MyReturn&lt;T&gt;   = T extends (...args: never[]) => infer R ? R : never;
//                                                     └── how ReturnType works</pre></div>

      <h2>Step through real evaluations</h2>
      <div class="demo">
        <p class="demo__title">Live — watch the compiler "run" a type</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (c of cases; track c.label) {
            <button [class.ghost]="active() !== c" (click)="select(c)">{{ c.label }}</button>
          }
        </div>
        @if (active(); as c) {
          <div class="code"><pre>{{ c.expr }}</pre></div>
          <ol class="steps">
            @for (s of c.steps; track $index; let i = $index) {
              @if (i <= step()) {
                <li [class.now]="i === step()">{{ s }}</li>
              }
            }
          </ol>
          <div class="row" style="margin:8px 0">
            <button (click)="nextStep()" [disabled]="step() >= c.steps.length - 1">Step →</button>
            <button class="ghost" (click)="step.set(0)">Restart</button>
          </div>
          @if (step() >= c.steps.length - 1) {
            <p style="color:var(--green)">result: <code>{{ c.result }}</code></p>
          }
        }
      </div>

      <h2>Distribution — the semantics that make Exclude work</h2>
      <p>
        The fourth case above hinges on a rule worth stating precisely: when the
        checked type is a <strong>bare type parameter</strong> and you instantiate it
        with a union, the conditional maps over each member and unions the results.
        That's why one-line filters over unions work at all. When you <em>don't</em>
        want it, wrap both sides in a one-element tuple — matching a non-bare
        pattern disables distribution:
      </p>
      <div class="code"><pre>type ToArray&lt;T&gt;  = T extends unknown ? T[] : never;
type ToArrayND&lt;T&gt; = [T] extends [unknown] ? T[] : never;   // ND = non-distributive

ToArray&lt;string | number&gt;    // string[] | number[]   (per member)
ToArrayND&lt;string | number&gt;  // (string | number)[]   (union kept whole)</pre></div>
      <div class="warn">
        Distribution's sharp edge: <code>never</code> is the empty union, so a
        distributive conditional over <code>never</code> has nothing to iterate —
        the result is <code>never</code> itself, whatever your branches say.
        <code>IsNever&lt;T&gt; = T extends never ? true : false</code> famously returns
        <code>never</code>, not <code>true</code>; the fix is the tuple wrap:
        <code>[T] extends [never]</code>. If a conditional type ever behaves
        "impossibly", suspect distribution first.
      </div>

      <h2>Template literal types — string building for types</h2>
      <div class="code"><pre>type EventName = \`on\${{ '{' }}Capitalize&lt;'click' | 'hover'&gt;{{ '}' }}\`;
//   unions inside a template DISTRIBUTE combinatorially:
//   → 'onClick' | 'onHover'

type Px = \`\${{ '{' }}number{{ '}' }}px\`;     // matches '4px', '12.5px' — any number then px
type Route = \`/users/\${{ '{' }}string{{ '}' }}\`;   // constrain string patterns

// with key remapping, this types whole API surfaces from data:
type Handlers&lt;T&gt; = {{ '{' }} [K in keyof T as \`on\${{ '{' }}Capitalize&lt;string &amp; K&gt;{{ '}' }}Change\`]: (v: T[K]) => void {{ '}' }};
// Handlers&lt;{{ '{' }}name: string; age: number{{ '}' }}&gt;
//   → {{ '{' }} onNameChange: (v: string) => void; onAgeChange: (v: number) => void {{ '}' }}</pre></div>

      <h2>Rebuild the standard library (the classic interview exercise)</h2>
      <div class="code"><pre>type MyPartial&lt;T&gt;  = {{ '{' }} [K in keyof T]?: T[K] {{ '}' }};
type MyRequired&lt;T&gt; = {{ '{' }} [K in keyof T]-?: T[K] {{ '}' }};
type MyReadonly&lt;T&gt; = {{ '{' }} readonly [K in keyof T]: T[K] {{ '}' }};
type MyPick&lt;T, K extends keyof T&gt; = {{ '{' }} [P in K]: T[P] {{ '}' }};   // loop over the CHOSEN keys
type MyExclude&lt;T, U&gt; = T extends U ? never : T;              // distribution does the work
type MyOmit&lt;T, K extends PropertyKey&gt; = MyPick&lt;T, MyExclude&lt;keyof T, K&gt;&gt;;  // compose!
type MyRecord&lt;K extends PropertyKey, V&gt; = {{ '{' }} [P in K]: V {{ '}' }};
type MyReturnType&lt;T&gt; = T extends (...a: never[]) => infer R ? R : never;</pre></div>
      <p>
        Notice <code>MyOmit</code>: it's <code>Pick</code> of
        (<code>keyof T</code> minus <code>K</code>) — utility types compose like
        functions. Being able to derive these on a whiteboard is a common senior
        interview checkpoint, and now each one is a one-liner you understand.
      </p>

      <div class="warn">
        Power budget: in <em>app</em> code you should mostly consume the built-in
        utilities; write custom mapped/conditional types when you're building
        <strong>reusable libraries or framework-level helpers</strong> (typed form
        builders, API clients, event maps). A type that takes minutes to understand
        costs every reader those minutes forever — same code-review rules as clever
        runtime code.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Write <code>OptionalKeys&lt;T&gt;</code>: the union of T's optional key names.</summary>
        <div><code>type OptionalKeys&lt;T&gt; = {{ '{' }} [K in keyof T]-?: undefined extends T[K] ? K : never {{ '}' }}[keyof T]</code>.
        The mapped type writes each key's name (or never) as its value, and indexing
        by <code>[keyof T]</code> unions the values — the standard "map keys to
        answers, then collect" idiom. (The <code>undefined extends T[K]</code> test
        detects optionality.)</div>
      </details>
      <details class="qa">
        <summary>Why does <code>Exclude&lt;boolean, true&gt;</code> give <code>false</code>?</summary>
        <div><code>boolean</code> is secretly the union <code>true | false</code>, so
        distribution runs the conditional per member: <code>true</code> is excluded,
        <code>false</code> survives. A nice proof that distribution operates on the
        union's members, however the union was spelled.</div>
      </details>
      <details class="qa">
        <summary>What does <code>keyof T</code> return for <code>T = {{ '{' }} a: 1 {{ '}' }} | {{ '{' }} b: 2 {{ '}' }}</code>, and why?</summary>
        <div><code>never</code> — keyof a union is the keys present on <em>every</em>
        member (a value of T might be either shape, so only shared keys are safe),
        and these share none. Corollary: mapped types over unions of different
        shapes don't do what people first expect; distribute first with a
        conditional if you need per-member mapping.</div>
      </details>
      <details class="qa">
        <summary>Implement <code>Awaited</code>-lite: unwrap nested promises (<code>Promise&lt;Promise&lt;T&gt;&gt;</code> → <code>T</code>).</summary>
        <div>Recursion — conditional types may reference themselves:
        <code>type DeepUnwrap&lt;T&gt; = T extends Promise&lt;infer V&gt; ? DeepUnwrap&lt;V&gt; : T</code>.
        Each match peels one Promise layer and recurses until the pattern stops
        matching. (The real <code>Awaited</code> adds thenable handling, but this is
        its skeleton.)</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>The type system is a language: mapped types are loops over <code>keyof</code>, conditionals are if/else, <code>infer</code> is pattern-match capture, template literals are string interpolation.</li>
        <li>Mapped anatomy: <code>[K in keyof T](modifiers): T[K]</code>, with <code>?</code>/<code>readonly</code> addable or strippable (<code>-</code>), and <code>as</code> to rename — or drop via <code>never</code>.</li>
        <li>Bare-parameter conditionals <strong>distribute</strong> over unions (how <code>Exclude</code> works); wrap in <code>[T]</code> tuples to opt out, and remember the <code>never</code> edge case.</li>
        <li>Every built-in utility is a one-liner you can now derive — <code>Omit = Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;</code>; they compose.</li>
        <li>Reach for hand-written type programs in libraries and helpers, not everyday app code.</li>
      </ul>

      <p><a routerLink="/ts-decorators">Next: Decorators →</a></p>
    </article>
  `,
  styles: [
    `.steps { padding-left: 20px; }
     .steps li { margin: 6px 0; font-size: .92rem; }
     .steps li.now { color: var(--text); font-weight: 500; }
     .steps li:not(.now) { color: var(--text-muted); }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class MappedConditional {
  protected readonly cases = EVAL_CASES;
  protected readonly active = signal<EvalCase>(EVAL_CASES[0]);
  protected readonly step = signal(0);

  protected select(c: EvalCase) {
    this.active.set(c);
    this.step.set(0);
  }
  protected nextStep() {
    this.step.update((s) => Math.min(s + 1, this.active().steps.length - 1));
  }
}
