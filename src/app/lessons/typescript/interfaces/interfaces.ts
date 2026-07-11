import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Interfaces vs type aliases — member syntax dissected (optional,
 * readonly, methods vs function properties), extends vs intersection and
 * where they differ on conflicts, the decision table with reasoning, a live
 * shape-checker demo, declaration merging as the module-augmentation tool,
 * callable/index/hybrid/generic signatures, and implements semantics.
 */

interface CandidateShape {
  label: string;
  value: string;
  verdict: 'ok' | 'error';
  explain: string;
}

const CANDIDATES: CandidateShape[] = [
  {
    label: 'exact match',
    value: `{ id: 1, name: 'Ada', createdAt: new Date() }`,
    verdict: 'ok',
    explain: 'Every required member present with the right type. email? may be absent — that is what the ? grants.',
  },
  {
    label: 'missing name',
    value: `{ id: 1, createdAt: new Date() }`,
    verdict: 'error',
    explain: `Property 'name' is missing in type … but required in type 'User'. Required members are non-negotiable; the error names exactly what's absent.`,
  },
  {
    label: 'wrong type for id',
    value: `{ id: '1', name: 'Ada', createdAt: new Date() }`,
    verdict: 'error',
    explain: `Types of property 'id' are incompatible: string is not assignable to number. Shape checks are per-member and recursive.`,
  },
  {
    label: 'extra property (variable)',
    value: `const x = { id: 1, name: 'Ada', createdAt: new Date(), nickname: 'A' }; const u: User = x;`,
    verdict: 'ok',
    explain: 'Structural typing: MORE than required is compatible when assigned via a variable. The nickname is simply invisible through the User lens.',
  },
  {
    label: 'extra property (literal)',
    value: `const u: User = { id: 1, name: 'Ada', createdAt: new Date(), nickname: 'A' };`,
    verdict: 'error',
    explain: `Object literal may only specify known properties. Fresh literals get the stricter "excess property check" — an unknown key in a literal is almost always a typo, so TS flags it at the assignment.`,
  },
];

@Component({
  selector: 'app-lesson-ts-interfaces',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Interfaces vs Type Aliases</h1>
      <p class="lead">
        Both <code>interface</code> and <code>type</code> describe the <em>shape</em>
        of data — the contracts you'll write constantly for API responses, component
        inputs and service boundaries. They're erased at compile time: pure
        compiler-facing documentation. This page covers the member syntax in detail,
        the real differences between the two keywords (there are fewer than folklore
        claims, but the ones that exist matter), and the signature forms beyond
        plain objects.
      </p>

      <h2>Describing object shapes — every member form</h2>
      <div class="code"><pre>interface User {{ '{' }}
  id: number;                 // required property
  name: string;
  email?: string;             // OPTIONAL — its type becomes string | undefined,
                              //   and reads must handle the undefined case
  readonly createdAt: Date;   // READONLY — assignment after creation is an error
                              //   (shallow: the Date's own methods still mutate it)
  greet(): string;            // method shorthand
  onSave: (u: User) => void;  // property holding a function — almost the same…
{{ '}' }}

type UserT = {{ '{' }} id: number; name: string {{ '}' }};   // same shape, alias syntax</pre></div>
      <ul>
        <li><strong><code>?</code> means "may be absent".</strong> Callers can omit the key entirely; readers get <code>string | undefined</code> and must narrow. (Under the <code>exactOptionalPropertyTypes</code> flag, "absent" and "explicitly set to undefined" even become distinct cases.)</li>
        <li><strong><code>readonly</code> is compile-time only</strong> and shallow — it forbids <code>user.createdAt = …</code> but not mutation <em>inside</em> the value. It's the property-level version of the const-seals-the-arrow rule.</li>
        <li><strong>Method vs function-property</strong> — <code>greet(): string</code> vs <code>greet: () =&gt; string</code> — differ in one subtle way: method syntax gets looser (bivariant) parameter checking for compatibility reasons. House rule in strict codebases: use the property/arrow form for callbacks.</li>
      </ul>

      <h2>Watch the checker apply a shape</h2>
      <div class="demo">
        <p class="demo__title">Live — which candidates satisfy <code>User</code>?</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (c of candidates; track c.label) {
            <button [class.ghost]="candidate() !== c" (click)="candidate.set(c)">{{ c.label }}</button>
          }
        </div>
        @if (candidate(); as c) {
          <div class="code"><pre>{{ c.value }}</pre></div>
          <p style="font-size:.92rem">
            <strong [style.color]="c.verdict === 'ok' ? 'var(--green)' : '#ef4444'">
              {{ c.verdict === 'ok' ? '✅ compiles' : '❌ compile error' }}
            </strong>
            — {{ c.explain }}
          </p>
        }
      </div>
      <p>
        Cases 4 and 5 are the pair that surprises people — same object, different
        verdicts. The rule from the Types lesson applies: structural compatibility
        tolerates extra members, but a <em>fresh literal</em> assigned directly gets
        the excess-property check, because there an unknown key can serve no purpose
        except being a mistake.
      </p>

      <h2>Extending &amp; composing</h2>
      <div class="code"><pre>interface Animal {{ '{' }} name: string; {{ '}' }}
interface Pet extends Animal {{ '{' }} owner: string; {{ '}' }}         // extend one…
interface Dog extends Animal, Loggable {{ '{' }} breed: string; {{ '}' }} // …or several at once

type Admin = User & {{ '{' }} role: 'admin' {{ '}' }};    // type composes via INTERSECTION (&)
type Staff = User & Loggable;               // intersect any two types</pre></div>
      <p>
        Both express "this, plus more", with one practical difference at the edges:
        <code>extends</code> <em>checks compatibility at the declaration</em> — if
        Pet redeclared <code>name: number</code>, the interface itself errors, right
        there. An intersection with a conflicting member doesn't complain at the
        type — it quietly produces an impossible member
        (<code>string &amp; number</code> = <code>never</code>) and the error
        surfaces later, at whatever tries to construct one. Extends fails early with
        a good message; intersections fail late with a weird one.
      </p>

      <h2>When to use which — the honest table</h2>
      <table class="t">
        <tr><th></th><th>interface</th><th>type</th></tr>
        <tr><td>Object &amp; class shapes</td><td>✅ preferred</td><td>✅ works</td></tr>
        <tr><td>Unions, tuples, primitives, function types</td><td>❌ can't</td><td>✅ only option</td></tr>
        <tr><td>Mapped / conditional types</td><td>❌</td><td>✅ only option</td></tr>
        <tr><td>Declaration merging</td><td>✅ (see below)</td><td>❌ duplicate name = error</td></tr>
        <tr><td>Error messages &amp; checker perf</td><td>✅ stays a named, cached type</td><td>〜 can expand into structural noise in errors</td></tr>
      </table>
      <div class="tip">
        Rule of thumb: <strong>interface</strong> for object/class shapes (especially
        anything a consumer might extend); <strong>type</strong> for unions, tuples,
        function types, and anything computed. When both would do, interface gives
        marginally nicer tooling. What actually matters is consistency — pick the
        rule with your team and stop debating it.
      </div>

      <h2>Declaration merging — the interface superpower</h2>
      <p>
        Re-declaring an interface with the same name doesn't clash — the
        declarations <strong>merge</strong>. Sounds odd for your own code (it mostly
        is), but it's the sanctioned mechanism for <em>augmenting types you don't
        own</em>:
      </p>
      <div class="code"><pre>// analytics.d.ts — teach TS about a script your index.html injects:
declare global {{ '{' }}
  interface Window {{ '{' }} myAnalytics?: {{ '{' }} track(event: string): void {{ '}' }}; {{ '}' }}
{{ '}' }}

// anywhere in the app — now fully type-checked:
window.myAnalytics?.track('view');</pre></div>
      <p>
        The same mechanism lets libraries accept plugin-added fields (Express's
        <code>Request</code>, component prop maps, i18n key tables). When you see a
        library's docs say "augment this interface", this is what they mean. And it's
        why a <code>type</code> can't do it: aliases are bindings, and re-binding a
        name is an error; interfaces are declarations, and declarations accumulate.
      </p>

      <h2>Beyond plain objects — callable, index, generic, hybrid</h2>
      <div class="code"><pre>interface Handler {{ '{' }} (event: string): void; {{ '}' }}       // CALLABLE — a function's shape
interface Dictionary {{ '{' }} [key: string]: number; {{ '}' }}   // INDEX — any string key → number
interface Repo&lt;T&gt; {{ '{' }}                                   // GENERIC — a contract family
  get(id: number): T | undefined;
  save(item: T): void;
{{ '}' }}
interface Counter {{ '{' }}                                   // HYBRID — callable WITH members
  (start: number): string;                          //   (how old-school jQuery's $ was typed)
  reset(): void;
  count: number;
{{ '}' }}</pre></div>
      <ul>
        <li>The callable form types function <em>values</em> — though for simple cases the alias reads better: <code>type Handler = (event: string) =&gt; void</code>.</li>
        <li>Index signatures say "any key of this kind maps to this type". They pair with — and are increasingly replaced by — <code>Record&lt;string, number&gt;</code> from the utility-types lesson.</li>
        <li>Generic interfaces are <em>families</em> of contracts: <code>Repo&lt;User&gt;</code> and <code>Repo&lt;Order&gt;</code> are distinct, fully-checked instantiations of one definition.</li>
      </ul>

      <h2><code>implements</code> — classes signing the contract</h2>
      <div class="code"><pre>class FileRepo implements Repo&lt;File&gt; {{ '{' }}
  get(id: number) {{ '{' }} /* … */ return undefined; {{ '}' }}
  save(item: File) {{ '{' }} /* … */ {{ '}' }}
{{ '}' }}
// implements CHECKS the class against the shape — it adds no code, no runtime
// linkage, and a class may implement many interfaces.</pre></div>
      <p>
        Two Angular-relevant notes. First, this is exactly how lifecycle hooks are
        typed — <code>class MyComp implements OnInit</code> makes the compiler verify
        you really wrote <code>ngOnInit()</code>. Second, because interfaces are
        erased, you <em>cannot</em> ask "is this a Repo?" at runtime —
        <code>instanceof</code> only works with classes. If you need a runtime
        check, use a discriminant property or a type guard (Narrowing lesson).
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does Angular DI need <code>InjectionToken</code>s for interface-typed dependencies?</summary>
        <div>Interfaces are erased at compile time, so at runtime there is
        <em>nothing</em> for the injector to look up — <code>inject(MyInterface)</code>
        has no value to reference. Classes survive to runtime (they're real
        constructors), which is why services are classes and interface-shaped
        configs get a token. This one erasure fact explains a whole corner of
        Angular's API design.</div>
      </details>
      <details class="qa">
        <summary><code>type A = {{ '{' }} x: string {{ '}' }} &amp; {{ '{' }} x: number {{ '}' }}</code> — error or not? What's <code>A['x']</code>?</summary>
        <div>No error at the declaration — intersections merge silently. But
        <code>A['x']</code> is <code>string &amp; number</code>, which reduces to
        <code>never</code>: no value can ever satisfy it, so constructing an A fails
        wherever it's attempted, with a confusing message far from the cause. The
        same conflict via <code>extends</code> errors immediately at the interface —
        the early-vs-late failure difference in action.</div>
      </details>
      <details class="qa">
        <summary>You need "a User where every field is optional except id". Interface or type?</summary>
        <div>Type — it needs computation:
        <code>type UserPatch = Partial&lt;User&gt; &amp; Pick&lt;User, 'id'&gt;</code>.
        Mapped/conditional machinery only exists on the <code>type</code> side, which
        is the deep reason the "unions and computed types → type" rule exists.</div>
      </details>
      <details class="qa">
        <summary>A teammate writes <code>interface Props {{ '{' }} onClick: (e: Event) =&gt; void {{ '}' }}</code> vs <code>onClick(e: Event): void</code>. Any real difference?</summary>
        <div>Yes, one: method syntax is checked bivariantly (looser on parameter
        types, a compatibility concession), while the property/arrow form is strictly
        contravariant under <code>strictFunctionTypes</code>. For callbacks you want
        the strict checking — prefer the property form. Obscure until it isn't:
        this looseness can let a wrong handler type through.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Members: <code>?</code> = may be absent (and reads as <code>| undefined</code>); <code>readonly</code> = no reassignment (shallow, compile-time); prefer arrow-property over method syntax for strictly-checked callbacks.</li>
        <li>Structural checking tolerates extra members via variables but flags them on fresh literals (excess property check).</li>
        <li><code>extends</code> fails early on conflicts; intersections (<code>&amp;</code>) fail late via <code>never</code> members. Unions, tuples and mapped/conditional types are <code>type</code>-only; merging is <code>interface</code>-only.</li>
        <li>Declaration merging is how you augment types you don't own (Window, library interfaces).</li>
        <li>Interfaces are erased: no <code>instanceof</code>, and it's why Angular DI uses classes and InjectionTokens. <code>implements</code> is a compile-time contract check only.</li>
      </ul>

      <p><a routerLink="/ts-classes">Next: Classes &amp; Access Modifiers →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Interfaces {
  protected readonly candidates = CANDIDATES;
  protected readonly candidate = signal<CandidateShape>(CANDIDATES[0]);
}
