import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Utility types — the built-ins shown WITH their actual one-line
 * definitions (they're all mapped/conditional types you could write yourself),
 * homomorphic modifier preservation, the Pick-validates-keys/Omit-doesn't
 * asymmetry, union filtering via distribution, function/promise extractors,
 * a live Partial-patch demo and a live Pick/Omit key selector.
 */

interface User {
  id: number;
  name: string;
  email: string;
}

const USER_KEYS = ['id', 'name', 'email'] as const;
type UserKey = (typeof USER_KEYS)[number];

@Component({
  selector: 'app-lesson-ts-utility-types',
  imports: [RouterLink, JsonPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Advanced Types</span>
      <h1>Utility Types</h1>
      <p class="lead">
        TypeScript ships built-in generic types that transform other types. They
        keep one interface as the single source of truth and derive every variant
        shape from it — pure compile-time, zero emitted code. The secret this page
        leans on: <strong>none of them are magic</strong>. Each is a one- or two-line
        mapped or conditional type from <code>lib.d.ts</code> that you could write
        yourself — and reading those definitions is the fastest way to actually
        understand them.
      </p>

      <h2>The object transformers — with their real definitions</h2>
      <div class="code"><pre>interface User {{ '{' }} id: number; name: string; email: string; {{ '}' }}

// These are the ACTUAL lib.d.ts definitions:
type Partial&lt;T&gt;  = {{ '{' }} [K in keyof T]?: T[K] {{ '}' }};          // all optional → patch objects
type Required&lt;T&gt; = {{ '{' }} [K in keyof T]-?: T[K] {{ '}' }};         // -? STRIPS optionality
type Readonly&lt;T&gt; = {{ '{' }} readonly [K in keyof T]: T[K] {{ '}' }};  // immutable views
type Pick&lt;T, K extends keyof T&gt; = {{ '{' }} [P in K]: T[P] {{ '}' }};  // keep a subset of keys
type Omit&lt;T, K extends keyof any&gt; = Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;;
type Record&lt;K extends keyof any, V&gt; = {{ '{' }} [P in K]: V {{ '}' }}; // dictionary/map</pre></div>
      <p>
        The <code>[K in keyof T]</code> machinery is a <em>mapped type</em> — the
        <a routerLink="/ts-mapped-conditional">mapped &amp; conditional lesson</a>
        builds it from scratch. Two consequences of these definitions are worth
        internalizing:
      </p>
      <ul>
        <li><strong>Homomorphic mapping preserves modifiers.</strong> Because <code>Partial</code>/<code>Pick</code>/<code>Readonly</code> map directly over <code>keyof T</code>, existing <code>readonly</code> and <code>?</code> flags carry through — <code>Pick&lt;T, K&gt;</code> keeps a readonly member readonly. <code>Record</code> maps over an arbitrary key union instead, so it preserves nothing.</li>
        <li><strong><code>Pick</code> validates keys, <code>Omit</code> doesn't.</strong> Look at the constraints: Pick's <code>K extends keyof T</code> rejects <code>Pick&lt;User, 'emial'&gt;</code> at the call, but Omit accepts any key at all — <code>Omit&lt;User, 'emial'&gt;</code> compiles happily and removes nothing. A typo in an Omit is a <em>silent</em> no-op; teams that care define a strict <code>OmitStrict&lt;T, K extends keyof T&gt;</code>.</li>
      </ul>
      <div class="warn">
        All of these are <strong>shallow</strong> — one level deep.
        <code>Readonly&lt;State&gt;</code> lets you mutate <code>state.user.name</code>
        freely. Deep variants are recursive mapped types you write yourself (or take
        from a library), covered in the mapped-types lesson.
      </div>

      <h2>Live — Pick and Omit, key by key</h2>
      <div class="demo">
        <p class="demo__title">Toggle keys of <code>User</code> to build the K union</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (k of userKeys; track k) {
            <button [class.ghost]="!selected().has(k)" (click)="toggleKey(k)">{{ k }}</button>
          }
        </div>
        <p><code>Pick&lt;User, {{ keyUnion() }}&gt;</code> → <code>{{ pickResult() | json }}</code></p>
        <p><code>Omit&lt;User, {{ keyUnion() }}&gt;</code> → <code>{{ omitResult() | json }}</code></p>
        <p style="font-size:.88rem;color:var(--text-muted)">
          Perfect complements: for any key set K, <code>Pick&lt;T,K&gt; &amp; Omit&lt;T,K&gt;</code>
          reassembles T. Choose whichever names the <em>smaller or more stable</em> set.
        </p>
      </div>

      <h2>Union filters — powered by distribution</h2>
      <div class="code"><pre>type Role = 'admin' | 'member' | 'guest';

// definitions again — bare conditional types that DISTRIBUTE over unions:
type Exclude&lt;T, U&gt; = T extends U ? never : T;
type Extract&lt;T, U&gt; = T extends U ? T : never;

Exclude&lt;Role, 'guest'&gt;       // 'admin' | 'member'  (each member tested, guests → never)
Extract&lt;Role, 'admin'&gt;       // 'admin'
NonNullable&lt;string | null&gt;   // string  — Exclude&lt;T, null | undefined&gt;</pre></div>
      <p>
        Each member of the union is run through the conditional independently and
        the results are unioned back — <code>never</code> members simply vanish.
        That per-member "distribution" is the engine behind every union filter, and
        it's why these helpers do nothing useful on non-union types.
      </p>

      <h2>Function &amp; promise extractors</h2>
      <div class="code"><pre>declare function makeUser(name: string, age: number): User;

ReturnType&lt;typeof makeUser&gt;       // User
Parameters&lt;typeof makeUser&gt;       // [name: string, age: number] — a labeled tuple
ConstructorParameters&lt;typeof C&gt;   // tuple of a constructor's params
InstanceType&lt;typeof C&gt;            // what `new C()` produces
Awaited&lt;Promise&lt;Promise&lt;number&gt;&gt;&gt; // number — unwraps RECURSIVELY, like await does</pre></div>
      <ul>
        <li>These are conditional types using <code>infer</code> — e.g. <code>ReturnType&lt;T&gt; = T extends (...a: any) =&gt; infer R ? R : never</code>. The compiler pattern-matches the function type and captures a piece of it.</li>
        <li>Note the <code>typeof</code>: these operate on <em>types</em>, and <code>typeof fn</code> is how you lift a runtime function into type space (see <a routerLink="/ts-keyof-typeof">keyof &amp; typeof</a>).</li>
        <li><code>Awaited</code> is recursive on purpose — it models what <code>await</code> actually does to nested thenables. This is also the type <code>Promise.all</code> uses for its results.</li>
      </ul>

      <h2>String-literal helpers</h2>
      <div class="code"><pre>Uppercase&lt;'hi'&gt;     // 'HI'
Lowercase&lt;'HI'&gt;     // 'hi'
Capitalize&lt;'hi'&gt;    // 'Hi'
Uncapitalize&lt;'Hi'&gt;  // 'hi'

// where they earn their keep — deriving key families with template literals:
type Handlers = {{ '{' }} [K in 'click' | 'focus' as \`on\${{ '{' }}Capitalize&lt;K&gt;{{ '}' }}\`]: () =&gt; void {{ '}' }};
// {{ '{' }} onClick: () =&gt; void; onFocus: () =&gt; void {{ '}' }}</pre></div>

      <h2>Real-world combos</h2>
      <div class="code"><pre>// An update DTO: id required, everything else optional
type UserPatch = Pick&lt;User, 'id'&gt; &amp; Partial&lt;Omit&lt;User, 'id'&gt;&gt;;

// A typed lookup table — Record forces EVERY Role to have an entry:
const labels: Record&lt;Role, string&gt; = {{ '{' }} admin: 'Admin', member: 'Member', guest: 'Guest' {{ '}' }};
// add a Role to the union → this object errors until you add the label. Exhaustiveness for free.

// Form value derived from the model
type Form = Partial&lt;Pick&lt;User, 'name' | 'email'&gt;&gt;;

// A component's writable state derived from an API response
type Draft = {{ '{' }} -readonly [K in keyof ApiUser]: ApiUser[K] {{ '}' }};</pre></div>
      <p>
        The <code>Record&lt;UnionKeys, V&gt;</code> trick deserves emphasis: unlike an
        index signature (<code>[k: string]: V</code>, which allows <em>any</em> key
        and guarantees none), a Record over a finite union both restricts the keys
        <em>and requires all of them</em> — a compile-time exhaustiveness check on
        plain data.
      </p>

      <h2>Try it — Partial patch applied</h2>
      <div class="demo">
        <p class="demo__title">Live — base user merged with a Partial&lt;User&gt; patch</p>
        <div class="row" style="margin-bottom:8px">
          <button (click)="patch.set({ name: 'Grace' })">patch name</button>
          <button (click)="patch.set({ email: 'g@hopper.dev' })">patch email</button>
          <button class="ghost" (click)="patch.set({})">clear patch</button>
        </div>
        <p>patch: <code>{{ patch() | json }}</code></p>
        <p>result: <code>{{ merged() | json }}</code></p>
        <p style="font-size:.88rem;color:var(--text-muted)">
          The spread-merge is exactly the runtime mirror of the type:
          <code>Partial&lt;User&gt;</code> is "the type of a valid patch", and
          <code>{{ '{' }} ...base, ...patch {{ '}' }}</code> applies it. Type and
          value evolve together because both derive from <code>User</code>.
        </p>
      </div>

      <table class="t">
        <tr><th>Utility</th><th>Does</th><th>Under the hood</th></tr>
        <tr><td><code>Partial / Required</code></td><td>All props optional / required</td><td>mapped, <code>?</code> / <code>-?</code></td></tr>
        <tr><td><code>Readonly</code></td><td>All props readonly (shallow)</td><td>mapped, <code>readonly</code></td></tr>
        <tr><td><code>Pick / Omit</code></td><td>Keep / remove keys (Pick validates K, Omit doesn't)</td><td>mapped over K / Pick+Exclude</td></tr>
        <tr><td><code>Record&lt;K,V&gt;</code></td><td>Keys K → values V; exhaustive over finite unions</td><td>mapped over K</td></tr>
        <tr><td><code>Exclude / Extract / NonNullable</code></td><td>Filter a union</td><td>distributive conditional</td></tr>
        <tr><td><code>ReturnType / Parameters / Awaited</code></td><td>Read types out of functions &amp; promises</td><td>conditional + <code>infer</code></td></tr>
      </table>

      <div class="tip">
        These compose freely — <code>Readonly&lt;Pick&lt;User, 'id'&gt;&gt;</code> is
        perfectly normal. Derive variant shapes from one source-of-truth interface
        instead of duplicating it: when the model changes, every derived type
        updates (or errors) automatically. Duplicated shapes drift silently;
        derived shapes can't.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary><code>Omit&lt;User, 'emial'&gt;</code> (typo) — error or not? What about <code>Pick&lt;User, 'emial'&gt;</code>?</summary>
        <div>Omit: no error — its K is only constrained to <code>keyof any</code>
        (string|number|symbol), so the typo'd key is "removed" vacuously and you get
        back all of User. Pick: compile error, since <code>K extends keyof T</code>.
        The asymmetry exists so Omit can subtract keys from unions/intersections
        where exact key membership is awkward — but it means Omit typos are silent.
        Code-review accordingly, or use a strict wrapper.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>Record&lt;Role, string&gt;</code> error when you add a new Role, but <code>{{ '{' }} [k: string]: string {{ '}' }}</code> doesn't?</summary>
        <div>A Record over a <em>finite union</em> maps every member to a required
        property — a missing key is a missing required property, a compile error.
        An index signature promises nothing about which keys exist, so it can't
        detect the omission. Use Record+union when the key set is closed and you
        want exhaustiveness; use index signatures (or <code>Record&lt;string, V&gt;</code>,
        same thing) only for genuinely open dictionaries.</div>
      </details>
      <details class="qa">
        <summary>Does <code>Partial&lt;User&gt;</code> make <code>user.name.length</code> unsafe? Why?</summary>
        <div>Yes — every property becomes <code>T | undefined</code> (optional), so
        reads must narrow first: <code>patch.name?.length</code>. This is the point:
        Partial pushes the "might be absent" fact into the type so the compiler
        forces handling at every read. If only <em>some</em> fields may be absent,
        don't reach for Partial — model precisely with <code>?</code> on those
        fields, or <code>Partial&lt;Pick&lt;…&gt;&gt; &amp; Pick&lt;…&gt;</code>.</div>
      </details>
      <details class="qa">
        <summary>You need the resolved element type of <code>function load(): Promise&lt;User[]&gt;</code> without importing User. How?</summary>
        <div><code>type Loaded = Awaited&lt;ReturnType&lt;typeof load&gt;&gt;[number]</code>
        — ReturnType lifts out <code>Promise&lt;User[]&gt;</code>, Awaited unwraps to
        <code>User[]</code>, and indexing by <code>number</code> yields
        <code>User</code>. Chaining extractors like this keeps types flowing from
        the one true source (the function) instead of re-importing and re-declaring.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Every utility type is a short mapped or conditional type from <code>lib.d.ts</code> — read the definition and the behavior stops being folklore.</li>
        <li>Homomorphic mapped utilities (Partial/Pick/Readonly) preserve <code>?</code>/<code>readonly</code>; Record doesn't. All object transformers are shallow.</li>
        <li>Pick validates its keys; Omit accepts anything — Omit typos are silent no-ops.</li>
        <li>Union filters (Exclude/Extract/NonNullable) work via distributive conditionals; extractors (ReturnType/Parameters/Awaited) work via <code>infer</code>, and Awaited unwraps recursively.</li>
        <li><code>Record&lt;FiniteUnion, V&gt;</code> is a free exhaustiveness check on data. Compose utilities; never duplicate a shape by hand.</li>
      </ul>

      <p><a routerLink="/ts-keyof-typeof">Next: keyof, typeof &amp; Indexed Access →</a></p>
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
export class UtilityTypes {
  private readonly base: User = { id: 1, name: 'Ada', email: 'ada@example.com' };
  protected readonly patch = signal<Partial<User>>({});
  protected readonly merged = computed<User>(() => ({ ...this.base, ...this.patch() }));

  protected readonly userKeys = USER_KEYS;
  protected readonly selected = signal<Set<UserKey>>(new Set<UserKey>(['email']));

  protected toggleKey(k: UserKey) {
    this.selected.update((s) => {
      const next = new Set(s);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  protected keyUnion(): string {
    const keys = [...this.selected()];
    return keys.length ? keys.map((k) => `'${k}'`).join(' | ') : 'never';
  }

  protected pickResult(): Partial<User> {
    const out: Partial<User> = {};
    for (const k of this.selected()) (out as Record<string, unknown>)[k] = this.base[k];
    return out;
  }

  protected omitResult(): Partial<User> {
    const out: Partial<User> = {};
    for (const k of this.userKeys) {
      if (!this.selected().has(k)) (out as Record<string, unknown>)[k] = this.base[k];
    }
    return out;
  }
}
