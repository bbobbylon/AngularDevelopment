import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Narrowing & guards — how control-flow analysis actually tracks
 * types per reference, every built-in guard with its pitfall (typeof null,
 * cross-realm instanceof, truthiness on falsy values), discriminated unions
 * with a live loading/loaded/error state demo, user-defined guards and why
 * they're trusted rather than checked, assertion functions, exhaustiveness,
 * and where narrowing is lost (closures, aliasing, mutation).
 */

interface Cat {
  type: 'cat';
  meow(): string;
}
interface Dog {
  type: 'dog';
  bark(): string;
}
type Pet = Cat | Dog;

// user-defined type guard
function isCat(p: Pet): p is Cat {
  return p.type === 'cat';
}

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; data: string[] }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-lesson-ts-narrowing',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Type Narrowing & Guards</h1>
      <p class="lead">
        Narrowing is how TypeScript refines a broad type to a specific one inside a
        branch. The engine behind it is <strong>control-flow analysis</strong>: the
        compiler walks every possible path through your function and maintains, per
        <em>reference</em>, the set of types the value could still be at each
        location. An <code>if</code> splits the set; an early <code>return</code>
        or <code>throw</code> removes paths; reassignment resets. Union types are
        only usable <em>because</em> this analysis exists — a
        <code>string | number</code> is unusable until a check proves which one
        you're holding.
      </p>

      <h2>Built-in narrowing — with each guard's pitfall</h2>
      <div class="code"><pre>function fmt(x: string | number) {{ '{' }}
  if (typeof x === 'string') return x.trim();   // x: string here
  return x.toFixed(2);                           // x: number here — the ELSE narrows too
{{ '}' }}</pre></div>
      <ul>
        <li><strong><code>typeof x === 'string'</code></strong> — primitives only. Pitfall: <code>typeof null === 'object'</code> (a 30-year-old JS bug the spec keeps), and arrays are also <code>'object'</code>. TS knows both quirks — <code>typeof x === 'object'</code> narrows to <code>SomeObj | null</code>, keeping null in!</li>
        <li><strong><code>x instanceof Date</code></strong> — class instances via the prototype chain. Pitfall: fails across realms (iframe/worker objects have different constructors) and never works for interfaces — they're erased.</li>
        <li><strong><code>'bark' in pet</code></strong> — property presence. Narrows unions by which members declare the key; an <em>optional</em> property counts as present for narrowing even though it might be undefined at runtime.</li>
        <li><strong><code>Array.isArray(x)</code></strong> — the reliable array check (works cross-realm, unlike instanceof Array).</li>
        <li><strong><code>x === 'admin'</code></strong> — equality narrows to the literal; <code>switch</code> is a stack of these.</li>
        <li><strong><code>if (x)</code></strong> — truthiness, the blunt one (next warning).</li>
      </ul>
      <div class="warn">
        Truthiness narrowing is blunt: <code>0</code>, <code>''</code>,
        <code>NaN</code> and <code>false</code> are all falsy. Given
        <code>count: number | undefined</code>, <code>if (count)</code> wrongly
        treats a legitimate 0 like "absent". To exclude only null/undefined use
        <code>x != null</code> — the loose <code>!=</code> intentionally catches
        both nullish values in one comparison (one of the two sanctioned uses of
        loose equality).
      </div>

      <h2>Discriminated unions — the workhorse pattern</h2>
      <p>
        A shared literal field (the <em>discriminant</em>) lets <code>switch</code>
        narrow perfectly. This is how request state should be modeled: the
        impossible combinations (data present <em>and</em> error present) simply
        cannot be expressed:
      </p>
      <div class="code"><pre>type LoadState =
  | {{ '{' }} status: 'loading' {{ '}' }}
  | {{ '{' }} status: 'loaded'; data: string[] {{ '}' }}
  | {{ '{' }} status: 'error';  message: string {{ '}' }};

function render(s: LoadState) {{ '{' }}
  switch (s.status) {{ '{' }}
    case 'loading': return 'Spinner';
    case 'loaded':  return s.data.length;   // s.data exists ONLY here
    case 'error':   return s.message;       // s.message ONLY here
  {{ '}' }}
{{ '}' }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — a discriminated-union state machine</p>
        <div class="row" style="margin-bottom:10px">
          <button [class.ghost]="state().status !== 'loading'" (click)="setLoading()">loading</button>
          <button [class.ghost]="state().status !== 'loaded'" (click)="setLoaded()">loaded</button>
          <button [class.ghost]="state().status !== 'error'" (click)="setError()">error</button>
        </div>
        @switch (state().status) {
          @case ('loading') {
            <p>⏳ Spinner — no data, no message, and the compiler won't let this branch touch either.</p>
          }
          @case ('loaded') {
            <p>✅ {{ loadedData().join(', ') }} — <code>data</code> is available only in this branch.</p>
          }
          @case ('error') {
            <p style="color:#ef4444">❌ {{ errorMessage() }} — <code>message</code> exists only here.</p>
          }
        }
        <p style="font-size:.88rem;color:var(--text-muted)">
          The template's <code>&#64;switch</code> mirrors the TS switch — Angular's
          template type-checker narrows discriminated unions inside
          <code>&#64;case</code> branches exactly like the compiler does in code.
        </p>
      </div>
      <p>
        Compare with the "bag of flags" alternative —
        <code>{{ '{' }} loading: boolean; data?: string[]; error?: string {{ '}' }}</code> —
        which permits nonsense states (<code>loading &amp;&amp; error</code>) and forces
        defensive <code>?.</code> everywhere. Making illegal states unrepresentable
        is the single highest-leverage typing habit in application code.
      </p>

      <h2>User-defined type guards — powerful and trusted</h2>
      <div class="code"><pre>function isCat(p: Pet): p is Cat {{ '{' }} return p.type === 'cat'; {{ '}' }}
if (isCat(pet)) pet.meow();   // pet narrowed to Cat

// generic guard — filter out nulls AND narrow the array type:
function isPresent&lt;T&gt;(v: T): v is NonNullable&lt;T&gt; {{ '{' }} return v != null; {{ '}' }}
const names = [a, null, b].filter(isPresent);   // string[], not (string|null)[]</pre></div>
      <div class="warn">
        <code>x is T</code> is a <strong>promise, not a proof</strong> — the
        compiler checks that the body <em>could</em> be a guard, not that it's
        correct. <code>function isCat(p: Pet): p is Cat {{ '{' }} return true; {{ '}' }}</code>
        compiles, and every caller now mis-narrows. Guards concentrate trust:
        keep them tiny, test them, and put them next to the type they guard.
        (Since TS 5.5 simple guards like <code>v =&gt; v != null</code> passed
        straight to <code>filter</code> get their predicate <em>inferred</em> —
        no annotation needed.)
      </div>

      <h2>Assertion functions &amp; exhaustiveness</h2>
      <div class="code"><pre>// throws instead of returning false — narrows everything after the call:
function assert(cond: unknown, msg: string): asserts cond {{ '{' }}
  if (!cond) throw new Error(msg);
{{ '}' }}
assert(user, 'no user');   // below this line, user is non-null

function assertIsUser(v: unknown): asserts v is User {{ '{' }} /* validate or throw */ {{ '}' }}

function assertNever(x: never): never {{ '{' }} throw new Error('Unhandled: ' + x); {{ '}' }}
// switch default: assertNever(s) — add a union member and forget a case → COMPILE error,
// because the leftover member no longer narrows to never.</pre></div>
      <ul>
        <li>Assertion functions must be called through an <em>explicitly typed</em> reference — a quirk of the feature: <code>const a: typeof assert = assert</code> style annotations are required if you alias them.</li>
        <li><code>assertNever</code> turns "I handled every case" from a hope into a build guarantee. Wire it into every switch over a discriminated union.</li>
      </ul>

      <div class="demo">
        <p class="demo__title">Live — custom guard picking a branch</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="pick('cat')">cat</button>
          <button (click)="pick('dog')">dog</button>
        </div>
        <p>speak() → <strong>{{ sound() }}</strong></p>
        <p style="font-size:.88rem;color:var(--text-muted)">
          <code>isCat(pet) ? pet.meow() : pet.bark()</code> — in the true branch pet
          is Cat, in the false branch the compiler has <em>subtracted</em> Cat, leaving Dog.
        </p>
      </div>

      <h2>Where narrowing is lost — and why</h2>
      <div class="code"><pre>function f(x: string | null) {{ '{' }}
  if (x !== null) {{ '{' }}
    setTimeout(() =&gt; x.length);   // ❌ pre-5.x error / still fragile: the closure may
                                  //    run after x was reassigned somewhere
    const y = x;                  // ✅ capture into a const —
    setTimeout(() =&gt; y.length);   //    a const can never change, narrowing is permanent
  {{ '}' }}
{{ '}' }}</pre></div>
      <ul>
        <li><strong>Closures:</strong> narrowing of a mutable (<code>let</code>) variable doesn't survive into callbacks that might run later — the variable could be reassigned in between. Capture into a <code>const</code> first.</li>
        <li><strong>Function calls:</strong> calling any function resets narrowing on values that function could mutate (properties especially) — the compiler can't prove the callee didn't change them.</li>
        <li><strong>Property narrowing is shallower than variable narrowing:</strong> <code>if (obj.a)</code> narrows <code>obj.a</code>, but an intervening call or assignment to <code>obj</code> discards it. Destructure or copy to a local const for anything long-lived. (Since TS 4.4 narrowing <em>does</em> flow through const aliases of discriminants: <code>const {{ '{' }} status {{ '}' }} = s; if (status === 'loaded') …</code> narrows <code>s</code>.)</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary><code>typeof x === 'object'</code> where <code>x: string | Date | null</code> — what's x in the branch?</summary>
        <div><code>Date | null</code> — not just Date. <code>typeof null</code> is
        <code>'object'</code>, and TypeScript faithfully models the JS quirk, so the
        null stays until you also check <code>x !== null</code>. The idiomatic
        combined check: <code>if (typeof x === 'object' &amp;&amp; x !== null)</code>.
        Interviewers love this one because it tests JS knowledge and TS modeling at
        once.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>arr.filter(x =&gt; x != null)</code> historically stay <code>(T | null)[]</code>, and what are the two fixes?</summary>
        <div>A plain boolean-returning lambda gives the compiler no type-level
        information — filter's signature only sees <code>(v) =&gt; boolean</code>.
        Fix 1: a predicate-typed guard, <code>filter((x): x is T =&gt; x != null)</code>
        or a reusable <code>isPresent</code>. Fix 2: TypeScript 5.5+ infers the
        predicate automatically for simple single-return lambdas exactly like this
        one. Knowing both signals you understand <em>why</em> it works, not just the
        incantation.</div>
      </details>
      <details class="qa">
        <summary>Your <code>switch</code> over a 3-state union compiles today. A teammate adds a 4th state next sprint. What makes the switch fail the build instead of silently falling through?</summary>
        <div>An exhaustiveness default: <code>default: assertNever(s)</code>. With 3
        handled cases, <code>s</code> in the default is <code>never</code> — fine.
        After the 4th state is added, <code>s</code> there is the new variant, which
        is not assignable to <code>never</code>, so the call errors at compile time
        pointing at the exact switch. Without it, the switch returns undefined for
        the new state at runtime.</div>
      </details>
      <details class="qa">
        <summary>A guard <code>isAdmin(u: User): u is Admin</code> contains a bug and returns true for everyone. Does the compiler catch anything anywhere?</summary>
        <div>No — type predicates are trusted axioms. Every call site now treats
        plain users as Admin with full compiler blessing, and failures appear at
        runtime far from the guard. This is the same trust class as
        <code>as</code>-casts and <code>!</code>, just better dressed. Consequence:
        guards deserve unit tests more than almost any other tiny function, and
        validation guards at I/O boundaries (parsing JSON) should check
        <em>every</em> field they claim.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Control-flow analysis tracks each reference's possible types through branches, returns and throws — both the if and the else narrow.</li>
        <li>Know the guard pitfalls: <code>typeof null === 'object'</code>, instanceof fails cross-realm and on interfaces, truthiness eats <code>0</code>/<code>''</code> — use <code>x != null</code> for nullish-only.</li>
        <li>Discriminated unions make illegal states unrepresentable — model loading/loaded/error this way, and Angular templates narrow them in <code>&#64;switch</code>/<code>&#64;if</code> too.</li>
        <li><code>x is T</code> and <code>asserts</code> are trusted, not verified — keep guards tiny and tested. <code>assertNever</code> in the default turns forgotten cases into build errors.</li>
        <li>Narrowing dies across closures, calls and mutation — capture narrowed values into <code>const</code>s.</li>
      </ul>

      <p><a routerLink="/ts-utility-types">Next: Utility Types →</a></p>
    </article>
  `,
  styles: [
    `.qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Narrowing {
  protected readonly sound = signal('—');
  protected readonly state = signal<LoadState>({ status: 'loading' });

  protected setLoading() {
    this.state.set({ status: 'loading' });
  }
  protected setLoaded() {
    this.state.set({ status: 'loaded', data: ['alpha', 'beta', 'gamma'] });
  }
  protected setError() {
    this.state.set({ status: 'error', message: 'HTTP 500 — server exploded' });
  }

  protected loadedData(): string[] {
    const s = this.state();
    return s.status === 'loaded' ? s.data : [];
  }

  protected errorMessage(): string {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  }

  protected pick(type: 'cat' | 'dog') {
    const pet: Pet =
      type === 'cat'
        ? { type: 'cat', meow: () => '🐱 meow' }
        : { type: 'dog', bark: () => '🐶 woof' };
    this.sound.set(isCat(pet) ? pet.meow() : pet.bark());
  }
}
