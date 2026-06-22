import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
        Generics let you write reusable code that works over <em>many</em> types
        while keeping full type safety. They are the <code>&lt;T&gt;</code> you see all
        over Angular: <code>signal&lt;T&gt;</code>, <code>EventEmitter&lt;T&gt;</code>,
        <code>Observable&lt;T&gt;</code>, <code>HttpClient.get&lt;T&gt;</code>. Think of
        a type parameter as a "type variable" filled in at each call site.
      </p>

      <h2>Generic functions</h2>
      <div class="code">
        <pre>function identity&lt;T&gt;(value: T): T {{ '{' }} return value; {{ '}' }}

const a = identity('hi');     // T inferred as string → a: string
const b = identity(42);       // T inferred as number → b: number
const c = identity&lt;boolean&gt;(true); // explicit type argument (rarely needed)</pre>
      </div>
      <p>
        The type parameter <code>T</code> is normally <strong>inferred</strong> from the
        argument, so the return type tracks the input precisely — no <code>any</code>,
        no casts. Supply an explicit <code>&lt;T&gt;</code> only when inference can't
        figure it out (e.g. an empty array).
      </p>

      <h2>Generic classes</h2>
      <div class="code">
        <pre>class Box&lt;T&gt; {{ '{' }}
  constructor(public value: T) {{ '{' }}{{ '}' }}
  map&lt;U&gt;(fn: (v: T) =&gt; U): Box&lt;U&gt; {{ '{' }} return new Box(fn(this.value)); {{ '}' }}
{{ '}' }}

new Box(2).map(n =&gt; n * 10).map(n =&gt; n + '!');  // Box&lt;number&gt; → Box&lt;string&gt;</pre>
      </div>
      <p>
        Note how <code>map</code> introduces its <em>own</em> parameter <code>U</code>:
        the result type can differ from the input type, and TS threads it through the
        whole chain.
      </p>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row">
          <input type="number" [value]="seed()" (input)="seed.set(+$any($event.target).value)" style="width:90px" />
          <span class="pill">{{ boxResult() }}</span>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          new Box(n).map(n =&gt; n * 10).map(n =&gt; <code>'#' + n</code>) — the type flows from number to string.
        </p>
      </div>

      <h2>Constraints with <code>extends</code></h2>
      <p>
        A bare <code>T</code> could be anything, so you can't touch its members.
        Constrain it to guarantee a shape — then those members are safe to use:
      </p>
      <div class="code">
        <pre>interface Entity {{ '{' }} id: number; {{ '}' }}
function byId&lt;T extends Entity&gt;(items: T[], id: number): T | undefined {{ '{' }}
  return items.find(i =&gt; i.id === id);   // .id is guaranteed by the constraint
{{ '}' }}

// Constrain one parameter by another with keyof — fully type-safe property access:
function prop&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {{ '{' }}
  return obj[key];
{{ '}' }}
prop({{ '{' }} name: 'Ada', age: 36 {{ '}' }}, 'age');   // returns number; 'foo' would error</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Live — byId(users, id)</p>
        <div class="row">
          @for (u of users; track u.id) {
            <button class="ghost" (click)="lookup.set(u.id)">id {{ u.id }}</button>
          }
        </div>
        <p style="margin-top:10px">Found: <strong>{{ found() }}</strong></p>
      </div>

      <h2>Generic interfaces & type aliases</h2>
      <div class="code">
        <pre>interface ApiResult&lt;T&gt; {{ '{' }} data: T; status: number; {{ '}' }}
type Dict&lt;V&gt; = Record&lt;string, V&gt;;
type Pair&lt;A, B = A&gt; = [A, B];          // B defaults to A

const r: ApiResult&lt;User[]&gt; = {{ '{' }} data: [], status: 200 {{ '}' }};</pre>
      </div>

      <h2>Defaults & multiple type params</h2>
      <div class="code">
        <pre>interface ApiResult&lt;T = unknown&gt; {{ '{' }} data: T; status: number; {{ '}' }}
function pair&lt;A, B&gt;(a: A, b: B): [A, B] {{ '{' }} return [a, b]; {{ '}' }}
// a default must come after constrained params: &lt;T extends Entity, U = T&gt;</pre>
      </div>

      <h2>Generics in Angular</h2>
      <div class="code">
        <pre>count = signal&lt;number&gt;(0);
saved = output&lt;User&gt;();
email = new FormControl&lt;string&gt;('');
const TOKEN = new InjectionToken&lt;AppConfig&gt;('config');
this.http.get&lt;User[]&gt;('/api/users');     // response typed as User[]
viewChild&lt;ElementRef&gt;('box');</pre>
      </div>

      <div class="warn">
        Don't over-genericize. If a type parameter appears only once (e.g. a parameter
        type but never the return), it adds noise without safety — a plain type is
        clearer. And a generic that's secretly <code>any</code> (unconstrained, never
        used) buys you nothing.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Generics = type-safe reuse across many types via parameters like <code>&lt;T&gt;</code>.</li>
        <li>Type arguments are usually <strong>inferred</strong>; supply them explicitly only when inference fails.</li>
        <li><code>T extends X</code> constrains a parameter; <code>K extends keyof T</code> ties params together.</li>
        <li>Interfaces, type aliases and functions can all be generic, with defaults and multiple params.</li>
        <li>Angular's reactive, forms, DI and HTTP APIs are generic — typing them well pays off everywhere.</li>
      </ul>

      <p><a routerLink="/components">Next: Angular Components →</a></p>
    </article>
  `,
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
