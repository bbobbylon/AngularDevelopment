import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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

@Component({
  selector: 'app-lesson-ts-narrowing',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Type Narrowing & Guards</h1>
      <p class="lead">
        Narrowing is how TypeScript refines a broad type to a more specific one inside a
        branch of code. The compiler runs <strong>control-flow analysis</strong>:
        as it reads your <code>if</code>/<code>switch</code>/early-returns it tracks what
        each variable could be at every line. This is what makes union types safe.
      </p>

      <h2>Built-in narrowing</h2>
      <div class="code">
        <pre>function fmt(x: string | number) {{ '{' }}
  if (typeof x === 'string') return x.trim();   // x: string here
  return x.toFixed(2);                           // x: number here (the else)
{{ '}' }}</pre>
      </div>
      <ul>
        <li><code>typeof x === 'string'</code> — primitives (string/number/boolean/bigint/symbol/object/function/undefined)</li>
        <li><code>x instanceof Date</code> — class instances</li>
        <li><code>'bark' in pet</code> — property presence</li>
        <li><code>Array.isArray(x)</code> — arrays</li>
        <li><code>if (x)</code> / <code>x != null</code> — truthiness &amp; null checks</li>
        <li><code>x === 'admin'</code> — equality narrows to the literal</li>
      </ul>
      <div class="warn">
        Truthiness narrowing is blunt: <code>0</code>, <code>''</code>,
        <code>NaN</code> and <code>false</code> are all falsy. To exclude only
        null/undefined, use <code>x != null</code> (loose <code>!=</code> catches both)
        rather than <code>if (x)</code>.
      </div>

      <h2>Discriminated unions</h2>
      <p>
        A shared literal field (the "discriminant") lets <code>switch</code>/<code>if</code>
        narrow a union perfectly — the most useful pattern in app code (think
        loading/loaded/error states):
      </p>
      <div class="code">
        <pre>type State =
  | {{ '{' }} status: 'loading' {{ '}' }}
  | {{ '{' }} status: 'loaded'; data: User[] {{ '}' }}
  | {{ '{' }} status: 'error'; message: string {{ '}' }};

function render(s: State) {{ '{' }}
  switch (s.status) {{ '{' }}
    case 'loading': return 'Spinner';
    case 'loaded':  return s.data.length;   // s.data exists only here
    case 'error':   return s.message;       // s.message exists only here
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>User-defined type guards</h2>
      <p>A function returning <code>x is T</code> teaches the compiler about a custom check:</p>
      <div class="code">
        <pre>function isCat(p: Pet): p is Cat {{ '{' }} return p.type === 'cat'; {{ '}' }}
if (isCat(pet)) pet.meow();   // pet narrowed to Cat

// generic guard — filter out nulls and narrow the array type:
function isPresent&lt;T&gt;(v: T): v is NonNullable&lt;T&gt; {{ '{' }} return v != null; {{ '}' }}
const names = [a, null, b].filter(isPresent);   // string[], not (string|null)[]</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="pick('cat')">cat</button>
          <button (click)="pick('dog')">dog</button>
        </div>
        <p>speak() → <strong>{{ sound() }}</strong></p>
      </div>

      <h2>Assertion functions & exhaustiveness</h2>
      <div class="code">
        <pre>// throws (and narrows) instead of returning a boolean:
function assert(cond: unknown, msg: string): asserts cond {{ '{' }}
  if (!cond) throw new Error(msg);
{{ '}' }}
assert(user, 'no user');   // after this line, user is non-null

function assertNever(x: never): never {{ '{' }} throw new Error('Unhandled: ' + x); {{ '}' }}
// in a switch default: assertNever(s) → compile error if you add a case and forget it</pre>
      </div>

      <div class="tip">
        Narrowing is <strong>lost</strong> across a function/closure boundary — the
        compiler can't assume a value stays narrowed after an arbitrary call. Re-check
        inside the callback, or capture the narrowed value in a <code>const</code> first.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Control-flow analysis narrows unions in each branch via <code>typeof</code>/<code>instanceof</code>/<code>in</code>/equality/truthiness.</li>
        <li>Use <code>x != null</code> to exclude only null/undefined without tripping on falsy values.</li>
        <li>Discriminated unions narrow via a shared literal field — model loading/error states this way.</li>
        <li>A guard returning <code>x is T</code> (or <code>asserts</code>) encodes custom checks for the compiler.</li>
        <li><code>assertNever</code> turns a forgotten union case into a build error.</li>
      </ul>

      <p><a routerLink="/ts-utility-types">Next: Utility Types →</a></p>
    </article>
  `,
})
export class Narrowing {
  protected readonly sound = signal('—');

  protected pick(type: 'cat' | 'dog') {
    const pet: Pet =
      type === 'cat'
        ? { type: 'cat', meow: () => '🐱 meow' }
        : { type: 'dog', bark: () => '🐶 woof' };
    this.sound.set(isCat(pet) ? pet.meow() : pet.bark());
  }
}
