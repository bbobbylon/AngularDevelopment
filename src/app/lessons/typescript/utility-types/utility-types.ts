import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-lesson-ts-utility-types',
  imports: [RouterLink, JsonPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Advanced Types</span>
      <h1>Utility Types</h1>
      <p class="lead">
        TypeScript ships built-in generic types that transform other types. They save
        you from hand-writing variant shapes, keep one interface as the single source of
        truth, and show up everywhere in well-typed Angular code. They are pure
        compile-time — they emit nothing.
      </p>

      <h2>The essentials</h2>
      <div class="code">
        <pre>interface User {{ '{' }} id: number; name: string; email: string; {{ '}' }}

Partial&lt;User&gt;      // all properties optional  → patch/update objects
Required&lt;User&gt;     // all properties required
Readonly&lt;User&gt;     // all properties readonly   → immutable state
Pick&lt;User, 'id' | 'name'&gt;   // keep a subset of keys
Omit&lt;User, 'email'&gt;          // everything except some keys
Record&lt;string, User&gt;        // a dictionary/map type</pre>
      </div>
      <div class="warn">
        <code>Partial</code>, <code>Readonly</code> and friends are <strong>shallow</strong>
        — they only affect the top level. For nested immutability you need a recursive
        (deep) variant, which you can build with mapped types.
      </div>

      <h2>Union & function helpers</h2>
      <div class="code">
        <pre>type Role = 'admin' | 'member' | 'guest';
Exclude&lt;Role, 'guest'&gt;      // 'admin' | 'member'
Extract&lt;Role, 'admin'&gt;      // 'admin'
NonNullable&lt;string | null&gt; // string

ReturnType&lt;typeof makeUser&gt;     // the return type of a function
Parameters&lt;typeof fn&gt;            // tuple of a function's parameter types
ConstructorParameters&lt;typeof C&gt; // tuple of a constructor's params
InstanceType&lt;typeof C&gt;           // the instance type a constructor produces
Awaited&lt;Promise&lt;number&gt;&gt;         // number — unwraps promises</pre>
      </div>

      <h2>String-literal helpers</h2>
      <div class="code">
        <pre>Uppercase&lt;'hi'&gt;     // 'HI'
Lowercase&lt;'HI'&gt;     // 'hi'
Capitalize&lt;'hi'&gt;    // 'Hi'
Uncapitalize&lt;'Hi'&gt; // 'hi'   — handy for deriving event names, keys, etc.</pre>
      </div>

      <h2>Real-world combos</h2>
      <div class="code">
        <pre>// An update DTO: id required, everything else optional
type UserPatch = {{ '{' }} id: number {{ '}' }} & Partial&lt;Omit&lt;User, 'id'&gt;&gt;;

// A typed lookup table
type UsersById = Record&lt;number, User&gt;;

// Form value derived from the model
type Form = Partial&lt;Pick&lt;User, 'name' | 'email'&gt;&gt;;</pre>
      </div>

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
      </div>

      <table class="t">
        <tr><th>Utility</th><th>Does</th></tr>
        <tr><td><code>Partial&lt;T&gt;</code> / <code>Required&lt;T&gt;</code></td><td>All props optional / required</td></tr>
        <tr><td><code>Readonly&lt;T&gt;</code></td><td>All props readonly (shallow)</td></tr>
        <tr><td><code>Pick&lt;T,K&gt;</code> / <code>Omit&lt;T,K&gt;</code></td><td>Keep / remove keys K</td></tr>
        <tr><td><code>Record&lt;K,V&gt;</code></td><td>Object with keys K, values V</td></tr>
        <tr><td><code>Exclude / Extract / NonNullable</code></td><td>Filter a union</td></tr>
        <tr><td><code>ReturnType / Parameters / Awaited</code></td><td>Read types from functions &amp; promises</td></tr>
      </table>

      <div class="tip">
        These compose. <code>Readonly&lt;Pick&lt;User, 'id'&gt;&gt;</code> is perfectly
        normal. Derive variant shapes from one source-of-truth interface instead of
        duplicating it — when the model changes, every derived type updates for free.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Utility types transform existing types — no duplication, zero runtime cost.</li>
        <li><code>Partial/Pick/Omit/Record</code> cover most day-to-day modelling (but are shallow).</li>
        <li><code>ReturnType/Parameters/InstanceType/Awaited</code> extract types from functions, classes &amp; promises.</li>
        <li>They compose freely — nest them to derive exactly the shape you need.</li>
      </ul>

      <p><a routerLink="/ts-keyof-typeof">Next: keyof, typeof &amp; Indexed Access →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin-top: 8px; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }`,
  ],
})
export class UtilityTypes {
  private readonly base: User = { id: 1, name: 'Ada', email: 'ada@example.com' };
  protected readonly patch = signal<Partial<User>>({});
  protected readonly merged = computed<User>(() => ({ ...this.base, ...this.patch() }));
}
