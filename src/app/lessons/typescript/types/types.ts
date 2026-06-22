import { DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

@Component({
  selector: 'app-lesson-ts-types',
  imports: [RouterLink, DecimalPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Types, Annotations & Inference</h1>
      <p class="lead">
        TypeScript adds a static type layer on top of JavaScript. Angular is
        written in TypeScript and its tooling (templates included) is fully
        type-checked, so a solid grasp of types is non-negotiable. Crucially, types
        are <strong>erased</strong> at build time — they guide the compiler and editor
        but ship no runtime code.
      </p>

      <h2>Primitives & annotations</h2>
      <p>An annotation is <code>: Type</code> after a name. The seven primitives:</p>
      <div class="code">
        <pre>let name: string = 'Ada';
let age: number = 36;              // all numbers are floats; no int/float split
let active: boolean = true;
let big: bigint = 9007199254740993n;
let sym: symbol = Symbol('id');
let nothing: null = null;
let missing: undefined = undefined;

let ids: number[] = [1, 2, 3];     // same as Array&lt;number&gt;
let pair: [string, number] = ['a', 1];        // fixed-length tuple
let rest: [string, ...number[]] = ['x', 1, 2]; // tuple with a rest element
function log(msg: string): void {{ '{' }} console.log(msg); {{ '}' }}</pre>
      </div>
      <ul>
        <li><code>number[]</code> and <code>Array&lt;number&gt;</code> are identical — pick one style.</li>
        <li>Tuples fix both <strong>length</strong> and <strong>per-position type</strong>; labels (<code>[x: number, y: number]</code>) document them.</li>
        <li>Use <code>readonly number[]</code> / <code>readonly [a, b]</code> to forbid mutation.</li>
      </ul>

      <h2>Inference & type widening</h2>
      <p>You rarely annotate initialised variables; TS infers them — but <code>let</code> and <code>const</code> infer differently:</p>
      <div class="code">
        <pre>let count = 0;          // widened to: number
const role = 'admin';   // narrowed to the literal type: 'admin'
let role2 = 'admin';    // widened to: string

const nums = [1, 2, 3];               // number[]  (still mutable)
const theme = {{ '{' }} primary: '#dd0031' {{ '}' }} as const;  // deeply readonly, literal types</pre>
      </div>
      <div class="tip">
        Annotate <strong>function parameters</strong>, <strong>return types of public
        APIs</strong>, and anything inference gets wrong. Let inference handle local
        variables — over-annotating is noise. <code>as const</code> freezes a value into
        its narrowest, readonly literal type — perfect for config objects and unions.
      </div>

      <h2>any vs unknown vs never vs void</h2>
      <table class="t">
        <tr><td><code>any</code></td><td>Opt out of type-checking entirely. Assignable to/from anything — it silently disables safety and spreads. Avoid; prefer <code>unknown</code>.</td></tr>
        <tr><td><code>unknown</code></td><td>The top type: holds anything, but you must <strong>narrow</strong> (typeof/instanceof/guards) before using it. The safe replacement for <code>any</code>.</td></tr>
        <tr><td><code>never</code></td><td>The bottom type: no value is assignable to it. Returned by functions that never finish (throw/infinite loop) and used to prove exhaustiveness.</td></tr>
        <tr><td><code>void</code></td><td>No useful return value. A <code>void</code>-typed callback may still return something (it's just ignored).</td></tr>
      </table>
      <div class="code">
        <pre>function parse(json: string): unknown {{ '{' }} return JSON.parse(json); {{ '}' }}
const data = parse('...');
// data.name;          ❌ Object is of type 'unknown'
if (typeof data === 'object' &amp;&amp; data) {{ '{' }} /* narrowed — safe to use */ {{ '}' }}</pre>
      </div>

      <h2>Union & literal types</h2>
      <p>
        A union (<code>|</code>) allows several types; a literal type restricts a value
        to specific constants. Together they model finite states precisely — far better
        than loose <code>string</code>/<code>number</code>:
      </p>
      <div class="code">
        <pre>type Level = 'beginner' | 'intermediate' | 'expert';
let lvl: Level = 'beginner';   // ✅
// lvl = 'wizard';             // ❌ compile error — typo caught at build time

type Status = 200 | 404 | 500;          // numeric literals
type Nullable&lt;T&gt; = T | null | undefined; // unions compose</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Live — a discriminated union & area()</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="shape.set({ kind: 'circle', radius: 5 })">circle</button>
          <button (click)="shape.set({ kind: 'rect', width: 4, height: 6 })">rectangle</button>
        </div>
        <p>shape = <code>{{ describe() }}</code></p>
        <p>area = <strong>{{ area() | number: '1.0-2' }}</strong></p>
      </div>

      <div class="code">
        <pre>function area(s: Shape): number {{ '{' }}
  switch (s.kind) {{ '{' }}
    case 'circle': return Math.PI * s.radius ** 2;  // s narrowed to circle
    case 'rect':   return s.width * s.height;        // s narrowed to rect
    default:
      const _exhaustive: never = s;   // ✅ compiles only if every case is handled
      return _exhaustive;
  {{ '}' }}
{{ '}' }}</pre>
      </div>
      <p>
        Switching on the shared <code>kind</code> field narrows the union — TS knows
        which properties exist in each branch. Assigning the leftover to
        <code>never</code> in <code>default</code> turns "I forgot a case" into a
        <strong>compile error</strong> — add a third shape and this function won't build
        until you handle it.
      </p>

      <h2>Structural typing & assertions</h2>
      <p>
        TypeScript is <strong>structural</strong> ("duck typing"): compatibility is by
        shape, not by name. Two unrelated types with the same members are interchangeable.
      </p>
      <div class="code">
        <pre>const el = document.querySelector('input') as HTMLInputElement; // assertion: trust me
const value = el!.value;        // non-null assertion: "this isn't null here"

const config = {{ '{' }} retries: 3 {{ '}' }} satisfies Record&lt;string, number&gt;; // validate, keep literal type</pre>
      </div>
      <div class="warn">
        <code>as</code> and <code>!</code> <strong>override</strong> the compiler without
        runtime checks — a wrong assertion crashes at runtime. Reach for narrowing first;
        prefer <code>satisfies</code> when you want to validate a value against a type
        <em>without</em> widening it.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Types are erased at build time; annotate parameters & public APIs, infer the rest.</li>
        <li><code>const</code> + <code>as const</code> keep literal types; <code>let</code> widens.</li>
        <li>Prefer <code>unknown</code> over <code>any</code>; use <code>never</code> for exhaustiveness.</li>
        <li>Union + literal types model finite states; discriminated unions narrow via a shared field.</li>
        <li>Typing is structural; <code>as</code>/<code>!</code> bypass safety — use sparingly, prefer <code>satisfies</code>.</li>
      </ul>

      <p><a routerLink="/ts-generics">Next: Generics →</a></p>
    </article>
  `,
  styles: [
    `
      .t {
        width: 100%;
        border-collapse: collapse;
      }
      .t td {
        padding: 8px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      .t td:first-child {
        width: 120px;
      }
    `,
  ],
})
export class Types {
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });

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
