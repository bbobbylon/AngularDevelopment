import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ts-interfaces',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Interfaces vs Type Aliases</h1>
      <p class="lead">
        Both <code>interface</code> and <code>type</code> describe the shape of data.
        You'll use them constantly to model API responses, component inputs and service
        contracts. They're erased at compile time — pure documentation for the compiler.
      </p>

      <h2>Describing object shapes</h2>
      <div class="code">
        <pre>interface User {{ '{' }}
  id: number;
  name: string;
  email?: string;            // optional — type is string | undefined
  readonly createdAt: Date;  // can't be reassigned after creation
  greet(): string;           // method shorthand
  onSave: (u: User) =&gt; void;  // property holding a function
{{ '}' }}

type UserT = {{ '{' }} id: number; name: string {{ '}' }};   // the same shape as a type alias</pre>
      </div>
      <div class="note">
        <code>email?: string</code> means the key may be absent. With
        <code>exactOptionalPropertyTypes</code>, "absent" and "present but
        <code>undefined</code>" become distinct — a subtle but useful strictness flag.
      </div>

      <h2>Extending & composing</h2>
      <div class="code">
        <pre>interface Animal {{ '{' }} name: string; {{ '}' }}
interface Pet extends Animal {{ '{' }} owner: string; {{ '}' }}        // extend one…
interface Dog extends Animal, Loggable {{ '{' }} breed: string; {{ '}' }} // …or several

type Admin = User & {{ '{' }} role: 'admin' {{ '}' }};                  // type uses intersection (&)
type Staff = User & Loggable;                              // intersect any types</pre>
      </div>

      <h2>When to use which?</h2>
      <table class="t">
        <tr><th></th><th>interface</th><th>type</th></tr>
        <tr><td>Object & class shapes</td><td>✅ preferred</td><td>✅</td></tr>
        <tr><td>Unions / tuples / primitives</td><td>❌</td><td>✅ only option</td></tr>
        <tr><td>Declaration merging</td><td>✅ (re-declare to add members)</td><td>❌</td></tr>
        <tr><td>Mapped / conditional types</td><td>❌</td><td>✅</td></tr>
        <tr><td>Better error messages / perf</td><td>✅ (named, cached)</td><td>～ (can expand inline)</td></tr>
      </table>

      <div class="tip">
        Rule of thumb: use <strong>interface</strong> for object/class shapes that might
        be extended; use <strong>type</strong> for unions, tuples, function types and
        anything computed. When both work, interface gives marginally nicer tooling.
      </div>

      <h2>Declaration merging (interface-only)</h2>
      <p>
        Re-declaring an interface <em>adds</em> to it — the mechanism behind augmenting
        third-party/global types:
      </p>
      <div class="code">
        <pre>interface Window {{ '{' }} myAnalytics?: Analytics; {{ '}' }}   // augment the global Window
window.myAnalytics?.track('view');               // now type-safe</pre>
      </div>

      <h2>Function, index & hybrid signatures</h2>
      <div class="code">
        <pre>interface Handler {{ '{' }} (event: string): void; {{ '}' }}         // callable type
interface Dictionary {{ '{' }} [key: string]: number; {{ '}' }}     // index signature
interface Repo&lt;T&gt; {{ '{' }} get(id: number): T | undefined; {{ '}' }} // generic interface
interface Counter {{ '{' }}                                      // hybrid: callable + props
  (start: number): string;
  reset(): void;
  count: number;
{{ '}' }}</pre>
      </div>

      <h2>Implementing in classes</h2>
      <div class="code">
        <pre>class FileRepo implements Repo&lt;File&gt; {{ '{' }}
  get(id: number) {{ '{' }} /* ... */ return undefined; {{ '}' }}
{{ '}' }}
// implements only CHECKS the shape — it adds no code and can implement many interfaces</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Both model shapes; <code>?</code> marks optional, <code>readonly</code> marks immutable.</li>
        <li><code>interface</code> extends (one or many); <code>type</code> intersects with <code>&amp;</code> and can express unions.</li>
        <li>Only <code>interface</code> supports declaration merging; only <code>type</code> does unions/mapped/conditional types.</li>
        <li>Interfaces can describe callable, indexable and hybrid shapes; classes <code>implements</code> them for a checked contract.</li>
      </ul>

      <p><a routerLink="/ts-classes">Next: Classes &amp; Access Modifiers →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }`,
  ],
})
export class Interfaces {}
