import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Enums & literal unions — what a regular enum actually compiles to
 * (the IIFE and the reverse map), string enums' quasi-nominal behavior,
 * const enum inlining and why isolatedModules dislikes it, bit flags with a
 * live permissions demo, and the modern as-const-object pattern that replaces
 * most enums outright.
 */

type Direction = 'north' | 'east' | 'south' | 'west';

const READ = 1 << 0;
const WRITE = 1 << 1;
const DELETE = 1 << 2;

@Component({
  selector: 'app-lesson-ts-enums',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Enums & Literal Unions</h1>
      <p class="lead">
        Enums name a set of related constants. They're worth understanding
        precisely because they're the <em>exception</em> to TypeScript's core
        promise: nearly every TS feature is erased at compile time, but a regular
        <code>enum</code> emits real runtime JavaScript. That one fact drives every
        trade-off on this page — and explains why modern codebases increasingly
        reach for <strong>string-literal unions</strong> or <code>as const</code>
        objects instead.
      </p>

      <h2>Numeric enums — and what they compile to</h2>
      <div class="code"><pre>enum Status {{ '{' }} Idle, Loading, Done {{ '}' }}   // 0, 1, 2 by default
enum Http {{ '{' }} OK = 200, NotFound = 404 {{ '}' }} // explicit values
let s: Status = Status.Loading;       // 1
Status[1];                            // 'Loading' — numeric enums get a reverse map</pre></div>
      <p>
        Under the hood, that first enum becomes an IIFE that builds a
        <em>double-keyed</em> object — this is the runtime code the "TS is erased"
        rule warned you about:
      </p>
      <div class="code"><pre>// emitted JavaScript:
var Status;
(function (Status) {{ '{' }}
  Status[Status["Idle"] = 0] = "Idle";       // Status.Idle = 0  AND  Status[0] = 'Idle'
  Status[Status["Loading"] = 1] = "Loading";
  Status[Status["Done"] = 2] = "Done";
{{ '}' }})(Status || (Status = {{ '{' }}{{ '}' }}));</pre></div>
      <ul>
        <li>The assignment-inside-an-index trick (<code>obj[obj.k = v] = 'k'</code>) is what creates the <strong>reverse map</strong>: name → number <em>and</em> number → name in one object.</li>
        <li>The <code>Status || (Status = {{ '{' }}{{ '}' }})</code> guard exists for <strong>declaration merging</strong> — enums, like namespaces, can be declared in multiple blocks that merge.</li>
        <li>Cost: the object survives in your bundle and is <em>not tree-shakable</em> (the IIFE has side effects, so bundlers keep it even if unused).</li>
      </ul>
      <div class="warn">
        A soundness wart worth knowing for exams: before TS 5.0, <em>any</em> number
        was assignable to a numeric enum type (<code>let s: Status = 99</code>
        compiled!). Modern TS only allows this for enums with computed members, but
        numbers still flow <em>out</em> freely — <code>Status.Done + 1</code> is a
        plain <code>number</code>, no error. Numeric enums are not a closed set at
        runtime.
      </div>

      <h2>String enums — stricter, and quasi-nominal</h2>
      <div class="code"><pre>enum Role {{ '{' }}
  Admin  = 'ADMIN',
  Member = 'MEMBER',
{{ '}' }}
let r = Role.Admin;   // 'ADMIN' — readable in logs &amp; network payloads

let bad: Role = 'ADMIN';       // ❌ error! a plain string is NOT assignable
let ok:  Role = Role.Admin;    // ✅ only the enum member itself qualifies</pre></div>
      <p>
        Two differences from numeric enums. First, <strong>no reverse map</strong> —
        the emitted object only maps name → value (a reverse entry would collide
        with member names). Second, string enums are TypeScript's only
        <em>quasi-nominal</em> type: even though <code>Role.Admin</code> <em>is</em>
        the string <code>'ADMIN'</code> at runtime, the type system refuses the raw
        literal. That's a feature (it forces all call sites through the named
        constant) and an annoyance (deserializing JSON into an enum-typed field
        needs a cast or a validation step — the wire gives you strings, not enum
        members).
      </p>

      <h2>Member rules: constant vs computed, heterogeneous</h2>
      <div class="code"><pre>enum Perm {{ '{' }}
  Read  = 1 &lt;&lt; 0,          // constant expression — fine
  Write = 1 &lt;&lt; 1,
  Admin = Read | Write,     // references to other constant members — fine
  Rand  = Math.random(),    // COMPUTED — allowed, but members after it need '='
{{ '}' }}
enum Mixed {{ '{' }} No = 0, Yes = 'YES' {{ '}' }}   // heterogeneous — legal, but a code smell</pre></div>
      <ul>
        <li>Auto-increment continues from the last constant value: <code>enum E {{ '{' }} A = 5, B {{ '}' }}</code> → B is 6.</li>
        <li>Computed members are why the compiler sometimes can't treat an enum as a closed literal set — prefer constant expressions.</li>
        <li><code>keyof typeof Perm</code> gives you the union of member <em>names</em> (<code>'Read' | 'Write' | …</code>) — the standard trick for iterating or validating enum keys.</li>
      </ul>

      <h2>Bit flags — the one place numeric enums shine</h2>
      <p>
        Powers of two combine with <code>|</code> and test with <code>&amp;</code> —
        one number carries a whole permission set. Toggle the flags and watch the
        composite value:
      </p>
      <div class="demo">
        <p class="demo__title">Live — permissions as bit flags</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          <button [class.ghost]="!hasFlag(READ)" (click)="toggle(READ)">Read (1)</button>
          <button [class.ghost]="!hasFlag(WRITE)" (click)="toggle(WRITE)">Write (2)</button>
          <button [class.ghost]="!hasFlag(DELETE)" (click)="toggle(DELETE)">Delete (4)</button>
        </div>
        <p>
          combined value: <strong>{{ perms() }}</strong>
          <span style="color:var(--text-muted)">(binary {{ permsBinary() }})</span>
        </p>
        <p style="font-size:.9rem">
          <code>perms &amp; WRITE</code> → {{ hasFlag(WRITE) ? 'truthy — can write ✅' : '0 — cannot write ❌' }}
        </p>
      </div>
      <div class="code"><pre>enum Perm {{ '{' }} Read = 1 &lt;&lt; 0, Write = 1 &lt;&lt; 1, Delete = 1 &lt;&lt; 2 {{ '}' }}
let p = Perm.Read | Perm.Write;   // 3
if (p &amp; Perm.Write) {{ '{' }} /* has write */ {{ '}' }}
p &amp;= ~Perm.Read;                  // remove a flag</pre></div>

      <h2>const enums — inlined, with strings attached</h2>
      <div class="code"><pre>const enum Size {{ '{' }} S, M, L {{ '}' }}
const x = Size.M;   // compiles to: const x = 1 /* Size.M */;  (no object emitted)</pre></div>
      <p>
        <code>const enum</code> erases completely — every reference is replaced by
        its literal value. Zero bundle cost, but three real restrictions:
      </p>
      <ul>
        <li><strong>No runtime value exists</strong> — you can't iterate members, index dynamically, or pass "the enum" anywhere.</li>
        <li><strong><code>isolatedModules</code> conflicts:</strong> tools that transpile one file at a time (esbuild, swc, Babel — i.e. most modern build chains, including Angular's) can't see the enum's values from another file, so cross-file const enums are rejected or silently demoted to regular enums.</li>
        <li><strong>Never export one from a library:</strong> consumers inline your <em>current</em> values into their bundles; if v2 renumbers members, already-compiled consumers keep the stale numbers. This is why the TS team itself now discourages const enums in published code.</li>
      </ul>

      <h2>…or just skip the enum: literal unions &amp; <code>as const</code></h2>
      <p>
        Often you don't need a runtime construct at all. A literal union is fully
        type-safe, costs nothing, serializes naturally, and needs no import at use
        sites. And when you <em>do</em> need a runtime list, one <code>as const</code>
        object yields both the type and the value:
      </p>
      <div class="code"><pre>type Direction = 'north' | 'east' | 'south' | 'west';

// Want the union AND a runtime list/object? Derive both from one as-const object:
const LogLevel = {{ '{' }} Debug: 'debug', Info: 'info', Error: 'error' {{ '}' }} as const;
type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];  // 'debug' | 'info' | 'error'
Object.values(LogLevel);   // ['debug', 'info', 'error'] — iterable at runtime

// (value and type may share a name — they live in separate declaration spaces)</pre></div>
      <p>
        Read that derivation inside-out: <code>typeof LogLevel</code> is the object's
        type, <code>keyof</code> lists its keys, and indexing by all keys yields the
        union of its <em>values</em> — the full mechanics are in the
        <a routerLink="/ts-keyof-typeof">keyof/typeof lesson</a>. Unlike a string
        enum, the raw literal <code>'debug'</code> <em>is</em> assignable — usually
        what you want at API boundaries.
      </p>

      <div class="demo">
        <p class="demo__title">Live — a literal union</p>
        <div class="row" style="margin-bottom:10px">
          @for (d of directions; track d) {
            <button [class.ghost]="dir() !== d" (click)="dir.set(d)">{{ d }}</button>
          }
        </div>
        <p>heading: <strong>{{ dir() }}</strong> ({{ degrees() }}°)</p>
        <p style="font-size:.88rem;color:var(--text-muted)">
          The degrees lookup is <code>Record&lt;Direction, number&gt;</code> — the
          compiler proves every direction has an entry, so no fallback is needed.
        </p>
      </div>

      <h2>Exhaustiveness — unions win here too</h2>
      <div class="code"><pre>function label(d: Direction): string {{ '{' }}
  switch (d) {{ '{' }}
    case 'north': return 'N';
    case 'east':  return 'E';
    case 'south': return 'S';
    case 'west':  return 'W';
    default:      return assertNever(d);   // add 'up' to the union → compile error HERE
  {{ '}' }}
{{ '}' }}</pre></div>
      <p>
        <code>assertNever</code> (see <a routerLink="/ts-narrowing">Narrowing</a>)
        works for enums too, but literal unions give crisper errors and the compiler
        can even flag <em>impossible</em> comparisons like
        <code>d === 'norht'</code> — a typo in an enum member name would simply fail
        to exist, while a typo in a raw string against a union is caught at the
        comparison.
      </p>

      <h2>Decision table</h2>
      <table class="t">
        <tr><th>Want…</th><th>Use</th></tr>
        <tr><td>A simple set of options (component state, mode)</td><td>String-literal union</td></tr>
        <tr><td>Union + a runtime list/lookup</td><td><code>as const</code> object + derived type</td></tr>
        <tr><td>Members must be used via the named constant only</td><td>String enum (quasi-nominal)</td></tr>
        <tr><td>Numeric/bit flags combined with <code>|</code>/<code>&amp;</code></td><td>Numeric <code>enum</code></td></tr>
        <tr><td>Zero runtime footprint, values in one file, no isolatedModules</td><td><code>const enum</code> (rarely worth it)</td></tr>
      </table>

      <div class="tip">
        Default to <strong>string-literal unions</strong>. They cost nothing at runtime,
        diff cleanly, and narrow beautifully (see <a routerLink="/ts-narrowing">Narrowing</a>).
        Reach for an enum only when you specifically want a named namespace, quasi-nominal
        checking, or bit flags — and never export a <code>const enum</code> from a library.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does <code>Object.keys(Status).length</code> return 6 for a 3-member numeric enum?</summary>
        <div>The reverse map. A numeric enum's emitted object holds both directions —
        <code>{{ '{' }} Idle: 0, Loading: 1, Done: 2, 0: 'Idle', 1: 'Loading', 2: 'Done' {{ '}' }}</code> —
        so keys double up (numeric keys come back as strings). To iterate members of a
        numeric enum you must filter: <code>Object.keys(Status).filter(k =&gt; isNaN(Number(k)))</code>.
        String enums don't have this problem — no reverse map.</div>
      </details>
      <details class="qa">
        <summary><code>let r: Role = 'ADMIN'</code> fails but <code>let d: Direction = 'north'</code> works. Why the asymmetry?</summary>
        <div>String enums are deliberately quasi-nominal: only <code>Role.Admin</code>
        satisfies <code>Role</code>, even though its runtime value is exactly
        <code>'ADMIN'</code>. Literal unions are purely structural — the literal
        itself is the type. This is the single biggest behavioral difference when
        choosing between them, and it bites hardest when parsing JSON, where the wire
        hands you plain strings.</div>
      </details>
      <details class="qa">
        <summary>Your build tool errors on a <code>const enum</code> imported from another file. What's going on?</summary>
        <div>Single-file transpilers (esbuild/swc/Babel under <code>isolatedModules</code>)
        compile each module in isolation, so when file B references
        <code>Size.M</code> from file A, the transpiler has no type information to
        inline the value — there's no emitted object to fall back on either. Fixes:
        make it a regular enum, move it into the consuming file, or switch to an
        <code>as const</code> object (which has a real runtime value and no inlining
        requirement).</div>
      </details>
      <details class="qa">
        <summary>Derive the union type from <code>const SIZES = ['s', 'm', 'l'] as const</code>.</summary>
        <div><code>type Size = (typeof SIZES)[number]</code> → <code>'s' | 'm' | 'l'</code>.
        Indexing an as-const tuple type by <code>number</code> unions all its element
        types. Without <code>as const</code> the array is <code>string[]</code> and
        you'd just get <code>string</code> — the const assertion is what preserves
        the literals.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A regular <code>enum</code> emits an IIFE-built object — numeric ones with a reverse map (name↔number), string ones without. It's runtime code and not tree-shakable.</li>
        <li>String enums are quasi-nominal: raw literals aren't assignable, only the member is. Numeric enums leak plain <code>number</code>s freely.</li>
        <li><code>const enum</code> inlines to literals — zero cost, but hostile to <code>isolatedModules</code> builds and dangerous to export from libraries.</li>
        <li>Bit flags (<code>1 &lt;&lt; n</code>, combine with <code>|</code>, test with <code>&amp;</code>) are the strongest remaining numeric-enum use case.</li>
        <li>Literal unions and <code>as const</code> objects cover most needs with zero runtime footprint — and <code>(typeof OBJ)[keyof typeof OBJ]</code> derives the union from the value.</li>
      </ul>

      <p><a routerLink="/ts-narrowing">Next: Type Narrowing &amp; Guards →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin-top: 8px; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Enums {
  protected readonly directions: Direction[] = ['north', 'east', 'south', 'west'];
  protected readonly dir = signal<Direction>('north');

  protected readonly READ = READ;
  protected readonly WRITE = WRITE;
  protected readonly DELETE = DELETE;
  protected readonly perms = signal(READ);
  protected readonly permsBinary = computed(() => this.perms().toString(2).padStart(3, '0'));

  protected hasFlag(flag: number): boolean {
    return (this.perms() & flag) !== 0;
  }

  protected toggle(flag: number) {
    this.perms.update((p) => p ^ flag);
  }

  protected degrees(): number {
    const map: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270 };
    return map[this.dir()];
  }
}
