import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: keyof / typeof / indexed access — deriving types FROM values so
 * nothing drifts, each operator dissected with edge cases, the type-safe
 * getter built up parameter by parameter, a live derived-keys demo, and the
 * single-source-of-truth pattern (const object → keys → values → unions)
 * used across real Angular codebases.
 */

const THEME = {
  primary: '#dd0031',
  accent: '#7c4dff',
  success: '#2ec16b',
} as const;

type ThemeKey = keyof typeof THEME; // 'primary' | 'accent' | 'success'

@Component({
  selector: 'app-lesson-ts-keyof-typeof',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Advanced Types</span>
      <h1>keyof, typeof &amp; Indexed Access</h1>
      <p class="lead">
        These three operators let you derive types <em>from</em> values and other
        types. That flips the usual direction of maintenance: instead of writing a
        type and praying it stays in sync with the data, you make the data the
        <strong>single source of truth</strong> and let the compiler recompute the
        types every build. Add a key to the object → every derived union, check and
        autocomplete updates itself. Nothing drifts, ever.
      </p>

      <h2>typeof — lift a value into a type</h2>
      <div class="code"><pre>const theme = {{ '{' }} primary: '#dd0031', accent: '#7c4dff' {{ '}' }} as const;

type Theme = typeof theme;
//           └── the TYPE-LEVEL typeof: "the type that this variable has"
// = {{ '{' }} readonly primary: '#dd0031'; readonly accent: '#7c4dff' {{ '}' }}

function makeUser(name: string) {{ '{' }} return {{ '{' }} id: 1, name {{ '}' }}; {{ '}' }}
type MakeUser = typeof makeUser;  // (name: string) =&gt; {{ '{' }} id: number; name: string {{ '}' }}
type UserShape = ReturnType&lt;typeof makeUser&gt;;  // the return object's type — for free</pre></div>
      <ul>
        <li><strong>Two typeofs share a keyword.</strong> The <em>runtime</em> <code>typeof x === 'string'</code> from the narrowing lesson evaluates while the program runs; this <em>type-level</em> one exists only in type positions and is erased. The compiler picks by context.</li>
        <li><strong><code>as const</code> is the difference between useful and mushy.</strong> Without it, <code>typeof theme</code> would be <code>{{ '{' }} primary: string; accent: string {{ '}' }}</code> — the literals widen and the derived keys/values lose their precision (widening rules from the Types lesson).</li>
        <li><strong>It only accepts identifiers and property chains</strong> — <code>typeof user.address</code> is fine, <code>typeof (a + b)</code> is not. Name the expression first if you need its type.</li>
        <li>The <code>ReturnType&lt;typeof fn&gt;</code> combo is everyday practice: functions that build objects define the shape once, in code, and the type tags along.</li>
      </ul>

      <h2>keyof — the union of a type's keys</h2>
      <div class="code"><pre>type ThemeKey = keyof typeof theme;      // 'primary' | 'accent'
//              └── the signature combo: value → type → union of key names

type AnyKey  = keyof Record&lt;string, number&gt;;   // string | number (index signature)
type ArrKeys = keyof string[];   // number | 'length' | 'push' | … (ALL array members!)</pre></div>
      <p>
        Line one is the pairing you'll type weekly: <code>typeof</code> lifts the
        value, <code>keyof</code> extracts the key union. The other two lines are the
        edge cases worth having seen once: an index-signature type's keyof is the
        index type itself (plus <code>number</code>, since numeric keys are
        stringified), and keyof an array includes every method name — usually a hint
        you wanted <code>T[number]</code> (below) instead.
      </p>

      <h2>Indexed access — look up a member's type</h2>
      <div class="code"><pre>interface User {{ '{' }} id: number; roles: string[]; address: {{ '{' }} city: string {{ '}' }} {{ '}' }}

type Id   = User['id'];               // number   — same brackets as runtime lookup,
type City = User['address']['city'];  // string     but operating on TYPES
type Vals = User[keyof User];         // number | string[] | {{ '{' }} city: string {{ '}' }}
//               └── index by a UNION → union of all value types

// indexing by number = an array/tuple's element type:
type Role   = User['roles'][number];  // string — "element type of roles"
type Tuple  = [boolean, string];
type Second = Tuple[1];               // string — tuples index per position</pre></div>
      <ul>
        <li>The key must be a <em>type</em>: <code>User['id']</code> (a literal type), not <code>User[myVariable]</code>. To use a variable's value as the key type: <code>User[typeof myKey]</code>.</li>
        <li><code>T[keyof T]</code> ("all the value types") and <code>T[number]</code> ("the element type") are the two idioms to memorize — the second is how you type "one item of this array I already have".</li>
      </ul>

      <h2>Build the classic type-safe getter, piece by piece</h2>
      <div class="code"><pre>function prop&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {{ '{' }}
  return obj[key];
{{ '}' }}
//  T                 — inferred from obj: the object's full type
//  K extends keyof T — key must be ONE OF T's actual keys; K captures WHICH one
//                      (as a literal type — pass 'id' and K is 'id', not string)
//  T[K]              — the return type is looked up from that exact key

prop(user, 'id');      // return type: number      — the compiler did the lookup
prop(user, 'roles');   // return type: string[]    — different key, different type
// prop(user, 'xyz');  // ❌ 'xyz' is not assignable to keyof User — typo caught</pre></div>
      <p>
        Read the three type parameters as a sentence: <em>"given any object T and a
        key K that provably belongs to T, I return exactly the type stored at
        K."</em> No overloads, no casts — and it self-updates when User gains a
        field. This one signature shape (<code>K extends keyof T</code> …
        <code>T[K]</code>) is the backbone of typed form helpers, ORMs, state
        selectors, and half the generic APIs you'll ever read.
      </p>

      <h2>Try it — types derived from the THEME object</h2>
      <div class="demo">
        <p class="demo__title">Live — this demo's buttons are generated from keyof</p>
        <div class="row" style="margin-bottom:10px">
          @for (k of keys; track k) {
            <button [class.ghost]="key() !== k" (click)="key.set(k)">{{ k }}</button>
          }
        </div>
        <p class="row">
          <span class="swatch" [style.background]="value()"></span>
          <code>THEME['{{ key() }}'] = {{ value() }}</code>
        </p>
        <div class="code"><pre>const THEME = {{ '{' }} primary: …, accent: …, success: … {{ '}' }} as const;

type ThemeKey = keyof typeof THEME;        // 'primary' | 'accent' | 'success'
const keys = Object.keys(THEME) as ThemeKey[];   // the buttons above
const key  = signal&lt;ThemeKey&gt;('primary');        // can ONLY hold real keys</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          That's this component's actual source. Add <code>warning: '#f5a623'</code>
          to THEME and — with zero other edits — a fourth button appears, the signal
          accepts it, and any typo'd key anywhere fails the build. One object, one
          truth. (The <code>as ThemeKey[]</code> is needed because
          <code>Object.keys</code> deliberately returns <code>string[]</code> —
          objects can have extra keys at runtime; here we know ours doesn't.)
        </p>
      </div>

      <h2>The pattern in the wild: const object instead of enum</h2>
      <div class="code"><pre>export const ROUTES = {{ '{' }}
  home: '/',
  lesson: '/lessons',
  practice: '/practice',
{{ '}' }} as const;

type RouteKey = keyof typeof ROUTES;             // 'home' | 'lesson' | 'practice'
type RoutePath = (typeof ROUTES)[RouteKey];      // '/' | '/lessons' | '/practice'

function go(to: RouteKey) {{ '{' }} router.navigateByUrl(ROUTES[to]); {{ '}' }}</pre></div>
      <p>
        Derive both the key union <em>and</em> the value union from one object —
        this "const object + derived types" combo is the modern alternative to
        <code>enum</code> for many teams (the Enums lesson picks up that debate),
        and you'll see it typing route tables, permission maps and config across
        production Angular codebases.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does <code>Object.keys(obj)</code> return <code>string[]</code> instead of <code>(keyof T)[]</code>?</summary>
        <div>Structural typing: a value of type T may have <em>extra</em> properties
        beyond T (remember: extra members are compatible via variables). So the
        honest static answer to "what keys might be there at runtime" is
        <code>string[]</code>. When you control the object (a local const), the
        <code>as (keyof typeof obj)[]</code> assertion is a reasonable, documented
        exception.</div>
      </details>
      <details class="qa">
        <summary>Derive the type of one item of <code>const rows = fetchRows()</code> where fetchRows returns <code>Row[]</code> — without importing Row.</summary>
        <div><code>type OneRow = ReturnType&lt;typeof fetchRows&gt;[number]</code> —
        typeof lifts the function, ReturnType extracts <code>Row[]</code>, and
        <code>[number]</code> indexes to the element. Chaining these operators to
        avoid re-declaring shapes is exactly what they're for.</div>
      </details>
      <details class="qa">
        <summary>What's the difference between <code>keyof T</code> and <code>T[keyof T]</code>?</summary>
        <div><code>keyof T</code> = union of the key <em>names</em>
        (<code>'id' | 'name'</code>); <code>T[keyof T]</code> = union of the value
        <em>types</em> (index T by all its keys at once →
        <code>number | string</code>). Keys vs values — the brackets do the hop.</div>
      </details>
      <details class="qa">
        <summary>The getter compiles, but <code>prop(user, someString)</code> errors when <code>someString: string</code>. Why, and what's the fix?</summary>
        <div><code>string</code> is wider than <code>keyof User</code> — the compiler
        can't prove an arbitrary string is a real key. Fix at the source: type the
        variable as <code>keyof User</code>, or narrow it first
        (<code>if (someString in user)</code> narrows in modern TS). The error is the
        feature: it's exactly how typo'd keys are kept out.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>typeof value</code> (type position) lifts a value/function into a type — pair with <code>as const</code> for precise literals and <code>ReturnType&lt;&gt;</code> for function results.</li>
        <li><code>keyof T</code> = union of key names; the everyday combo is <code>keyof typeof someConstObject</code>.</li>
        <li><code>T[K]</code> looks up member types; <code>T[keyof T]</code> = all value types; <code>T[number]</code> = array/tuple element type.</li>
        <li><code>&lt;T, K extends keyof T&gt;(obj: T, key: K) =&gt; T[K]</code> is the canonical type-safe accessor — learn to read it as a sentence.</li>
        <li>The strategic win: <strong>one const object as source of truth</strong>, all unions derived — add a key once, everything updates, typos can't compile.</li>
      </ul>

      <p><a routerLink="/ts-mapped-conditional">Next: Mapped &amp; Conditional Types →</a></p>
    </article>
  `,
  styles: [
    `.qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class KeyofTypeof {
  protected readonly keys = Object.keys(THEME) as ThemeKey[];
  protected readonly key = signal<ThemeKey>('primary');
  protected readonly value = computed(() => THEME[this.key()]);
}
