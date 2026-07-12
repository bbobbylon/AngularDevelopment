import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Generics — how inference actually picks T (arguments, widening,
 * best-common-supertype, const type params), constraints including the
 * K-extends-keyof-T pattern, generic classes with type-threading map chains,
 * the return-only-generic-is-a-cast trap (http.get<T> included), defaults,
 * where generics power every Angular API, and when NOT to genericize.
 */

/** A tiny generic container, like a typed box. */
class Box<T> {
  constructor(public value: T) {}
  map<U>(fn: (v: T) => U): Box<U> {
    return new Box(fn(this.value));
  }
}

/** Generic with a constraint: T must have an `id`. */
interface Entity {
  id: number;
}
function byId<T extends Entity>(items: T[], id: number): T | undefined {
  return items.find((i) => i.id === id);
}

@Component({
  selector: 'app-lesson-ts-generics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Generics</h1>
      <p class="lead">
        Generics let one piece of code serve <em>many</em> types without losing
        safety. A type parameter like <code>T</code> is a variable in type space,
        filled in per call site — and almost always filled in by
        <strong>inference</strong>, not by you. They're the <code>&lt;T&gt;</code>
        threaded through all of Angular: <code>signal&lt;T&gt;</code>,
        <code>Observable&lt;T&gt;</code>, <code>FormControl&lt;T&gt;</code>,
        <code>HttpClient.get&lt;T&gt;</code>. This page covers how inference decides,
        how constraints unlock members, and the one generic pattern that
        <em>looks</em> safe but is secretly a cast.
      </p>

      <h2>Generic functions — and how T is actually inferred</h2>
      <div class="code"><pre>function identity&lt;T&gt;(value: T): T {{ '{' }} return value; {{ '}' }}

const a = identity('hi');          // T = string (widened from 'hi')
const b = identity(42);            // T = number
const c = identity&lt;boolean&gt;(true); // explicit — rarely needed</pre></div>
      <p>Inference follows a few rules worth knowing by name:</p>
      <ul>
        <li><strong>Arguments drive it.</strong> T is solved from the argument types at the call. If T appears in several parameters, the compiler unions the candidates and picks the best common supertype — <code>pair(1, 'a')</code> against <code>pair&lt;T&gt;(a: T, b: T)</code> infers <code>string | number</code> (or errors if no sensible common type exists).</li>
        <li><strong>Literals widen by default.</strong> <code>identity('hi')</code> gives <code>string</code>, not <code>'hi'</code> — mutable positions widen literal types. When you <em>want</em> literals preserved, constrain toward them (<code>T extends string</code> nudges inference literal-ward) or use a <strong>const type parameter</strong>: <code>function pick&lt;const T&gt;(v: T)</code> keeps <code>pick(['a','b'])</code> as <code>readonly ['a','b']</code> — the call-site equivalent of <code>as const</code>.</li>
        <li><strong>Context flows backward too.</strong> In <code>const f: (x: number) =&gt; void = x =&gt; …</code>, the lambda's parameter is inferred from the target type — that's why callbacks in <code>map</code>/<code>subscribe</code> never need annotations.</li>
        <li><strong>Partial explicit arguments aren't a thing:</strong> supply all type arguments or none. (API designers work around it by splitting functions — the "curried factory" pattern.)</li>
      </ul>

      <h2>Generic classes</h2>
      <div class="code"><pre>class Box&lt;T&gt; {{ '{' }}
  constructor(public value: T) {{ '{' }}{{ '}' }}
  map&lt;U&gt;(fn: (v: T) =&gt; U): Box&lt;U&gt; {{ '{' }} return new Box(fn(this.value)); {{ '}' }}
{{ '}' }}

new Box(2).map(n =&gt; n * 10).map(n =&gt; n + '!');  // Box&lt;number&gt; → Box&lt;number&gt; → Box&lt;string&gt;</pre></div>
      <p>
        Two parameters cooperate here: the class's <code>T</code> is fixed per
        instance, while <code>map</code> introduces its own <code>U</code> per call —
        the output type may differ from the input, and the compiler threads it
        through the whole chain. This is precisely the shape of RxJS: an
        <code>Observable&lt;T&gt;</code> whose <code>pipe(map(fn))</code> produces
        <code>Observable&lt;U&gt;</code>, with every operator a link that transforms
        the type parameter.
      </p>
      <div class="demo">
        <p class="demo__title">Live — a Box chain, number in, string out</p>
        <div class="row">
          <input type="number" [value]="seed()" (input)="seed.set(+$any($event.target).value)" style="width:90px" />
          <span class="pill">{{ boxResult() }}</span>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          new Box(n).map(n =&gt; n * 10).map(n =&gt; <code>'#' + n</code>) — hover the chain
          in an editor and watch T flow: number → number → string.
        </p>
      </div>

      <h2>Constraints with <code>extends</code></h2>
      <p>
        An unconstrained <code>T</code> could be anything, so you can't touch its
        members — the constraint is what buys you capabilities:
      </p>
      <div class="code"><pre>interface Entity {{ '{' }} id: number; {{ '}' }}
function byId&lt;T extends Entity&gt;(items: T[], id: number): T | undefined {{ '{' }}
  return items.find(i =&gt; i.id === id);   // .id guaranteed by the constraint
{{ '}' }}
// crucial: the caller's FULL type survives — byId(users, 1) returns User | undefined,
// not Entity | undefined. A non-generic (items: Entity[]) signature would THROW AWAY
// everything about User except id. That's the whole reason to write the generic.

// Tie one parameter to another with keyof — fully checked property access:
function prop&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {{ '{' }}
  return obj[key];
{{ '}' }}
prop({{ '{' }} name: 'Ada', age: 36 {{ '}' }}, 'age');   // returns number; 'foo' → compile error</pre></div>
      <p>
        <code>K extends keyof T</code> is the most important constraint idiom in the
        language — it's the typed foundation under form builders, table column
        configs, <code>pluck</code>-style helpers, and state selectors. The return
        type <code>T[K]</code> (indexed access) resolves per call:
        <code>'age'</code> → number, <code>'name'</code> → string.
      </p>
      <div class="demo">
        <p class="demo__title">Live — byId(users, id), constraint in action</p>
        <div class="row">
          @for (u of users; track u.id) {
            <button class="ghost" (click)="lookup.set(u.id)">id {{ u.id }}</button>
          }
          <button class="ghost" (click)="lookup.set(99)">id 99</button>
        </div>
        <p style="margin-top:10px">Found: <strong>{{ found() }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          The <code>| undefined</code> in the return type is doing real work — id 99
          forces the not-found branch, and the compiler forced us to write it.
        </p>
      </div>

      <h2>The trap: a return-only generic is a disguised cast</h2>
      <div class="code"><pre>function fetchJson&lt;T&gt;(url: string): Promise&lt;T&gt; {{ '{' }}
  return fetch(url).then(r =&gt; r.json());   // json() returns any — T is NEVER checked
{{ '}' }}
const user = await fetchJson&lt;User&gt;('/api/user');  // feels safe. Is exactly \`as User\`.</pre></div>
      <p>
        When <code>T</code> appears only in the return type, inference has nothing
        to solve from — the caller just asserts whatever they like. Nothing at
        runtime verifies the payload. Angular's <code>http.get&lt;User&gt;(url)</code>
        is this same honest lie: a convenient <em>assertion</em> about the wire
        format, not a validation. That's fine as long as you know it — and it's
        why schema validators (zod, valibot) exist for boundaries you don't trust.
        Rule of thumb: a type parameter should appear in <strong>two</strong>
        positions (two params, or a param and the return) to be pulling real
        weight; used once, it's either a cast or noise.
      </p>

      <h2>Generic interfaces, aliases, defaults</h2>
      <div class="code"><pre>interface ApiResult&lt;T = unknown&gt; {{ '{' }} data: T; status: number; {{ '}' }}
type Dict&lt;V&gt; = Record&lt;string, V&gt;;
type Pair&lt;A, B = A&gt; = [A, B];              // defaults may reference earlier params

const r: ApiResult&lt;User[]&gt; = {{ '{' }} data: [], status: 200 {{ '}' }};
const s: ApiResult = {{ '{' }} data: whoKnows, status: 200 {{ '}' }};  // default kicks in: T = unknown</pre></div>
      <p>
        Note the default is <code>unknown</code>, not <code>any</code> — consumers of
        <code>s.data</code> must narrow before use. Defaulting to <code>any</code>
        would silently switch off checking for everyone who forgot the argument;
        defaulting to <code>unknown</code> makes forgetting safe.
      </p>

      <h2>Generics across Angular's API surface</h2>
      <div class="code"><pre>count = signal&lt;number&gt;(0);              // usually inferred: signal(0)
saved = output&lt;User&gt;();                  // the event payload type
email = new FormControl&lt;string&gt;('');     // typed forms — value is string, not any
const TOKEN = new InjectionToken&lt;AppConfig&gt;('config');  // inject(TOKEN): AppConfig
this.http.get&lt;User[]&gt;('/api/users');     // the honest-lie assertion from above
readonly box = viewChild&lt;ElementRef&gt;('box');  // query result type</pre></div>
      <p>
        Mostly you <em>consume</em> these generics rather than write your own — but
        the payoff compounds: a <code>FormControl&lt;string&gt;</code> makes
        <code>.value</code> a string everywhere; an
        <code>InjectionToken&lt;AppConfig&gt;</code> types every
        <code>inject(TOKEN)</code> in the app. One annotation at the definition,
        checking at every use.
      </p>

      <div class="warn">
        Don't over-genericize. If a type parameter appears only once, replace it
        with a plain type (or recognize you've written a cast). If a function never
        relies on what T is, <code>unknown</code> often serves better. Generic
        gymnastics in application code is usually a smell — the standard library
        and framework already did the hard generics; your job is mostly good
        constraints on small helpers.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does <code>byId&lt;T extends Entity&gt;(items: T[])</code> beat <code>byId(items: Entity[])</code> when both compile?</summary>
        <div>Information preservation. With <code>Entity[]</code>, a
        <code>User[]</code> argument is <em>accepted</em> (arrays are covariant here)
        but the return type collapses to <code>Entity | undefined</code> — name,
        email, everything beyond <code>id</code> is gone, and callers cast to get it
        back. The generic keeps the caller's own T flowing through to the return.
        Generics aren't about accepting more types — constraints handle that — they're
        about <em>not forgetting</em> which type came in.</div>
      </details>
      <details class="qa">
        <summary><code>const x = identity('hi')</code> types as <code>string</code>, but you need <code>'hi'</code>. Two fixes?</summary>
        <div>(1) <code>identity('hi' as const)</code> — the caller pins the literal.
        (2) Change the signature: <code>identity&lt;const T&gt;(v: T)</code> (TS 5.0+)
        or <code>identity&lt;T extends string&gt;(v: T)</code> — both make inference
        prefer the literal. The underlying rule: literal types widen in mutable
        positions unless something (a const assertion, a const type param, or a
        literal-flavored constraint) tells inference to keep them.</div>
      </details>
      <details class="qa">
        <summary>Is <code>this.http.get&lt;User&gt;('/api/user')</code> type-safe? Defend your answer.</summary>
        <div>Compile-time consistent, runtime unverified. T appears only in the
        return position, so nothing checks the actual JSON — the generic is an
        assertion that flows nice types through your app while the server can send
        anything. It's still worth writing (it documents intent and types all
        downstream code), but boundary trust is a separate decision: validate with
        a schema/guard where the contract is shaky, e.g. third-party APIs. Being
        able to articulate "generics are compile-time only" is the point of the
        question.</div>
      </details>
      <details class="qa">
        <summary>Design a <code>setProp(obj, key, value)</code> that rejects wrong value types per key. What's the signature?</summary>
        <div><code>function setProp&lt;T, K extends keyof T&gt;(obj: T, key: K, value: T[K]): void</code>.
        The trick is <em>reusing</em> K in the value position: once K is pinned to a
        specific literal key by the call, <code>T[K]</code> resolves to exactly that
        property's type — <code>setProp(user, 'age', 'old')</code> fails because
        <code>T['age']</code> is number. Three parameters, one constraint, zero
        runtime cost: the pattern behind every typed state-update helper.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>T is solved from arguments (with best-common-supertype across candidates); literals widen unless pinned by <code>as const</code>, a <code>const</code> type param, or a literal-leaning constraint.</li>
        <li>Constraints buy member access; <code>K extends keyof T</code> + <code>T[K]</code> is the idiom under typed property access, selectors and form helpers.</li>
        <li>Generics exist to <em>preserve</em> the caller's type through your code — a parameter used only once (especially return-only, like <code>http.get&lt;T&gt;</code>) is a compile-time assertion, not safety.</li>
        <li>Default type params to <code>unknown</code>, never <code>any</code>; classes fix T per instance while methods add fresh params per call (the RxJS shape).</li>
        <li>Angular's signals, outputs, typed forms, tokens and HTTP are all generic — consume them precisely before inventing your own.</li>
      </ul>

      <p><a routerLink="/components">Next: Angular Components →</a></p>
    </article>
  `,
  styles: [
    `.qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Generics {
  protected readonly seed = signal(2);
  protected readonly lookup = signal(1);

  protected readonly users: Entity[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

  protected boxResult(): string {
    return new Box(this.seed())
      .map((n) => n * 10)
      .map((n) => '#' + n).value;
  }

  protected found(): string {
    const u = byId(this.users, this.lookup());
    return u ? `user with id ${u.id}` : 'not found';
  }
}
