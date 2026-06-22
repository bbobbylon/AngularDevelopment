import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ts-mapped-conditional',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Advanced Types</span>
      <h1>Mapped & Conditional Types</h1>
      <p class="lead">
        These are the engine behind the utility types. With mapped, conditional and
        template-literal types you can transform one type into another
        programmatically — useful for library-grade typings.
      </p>

      <h2>Mapped types — iterate over keys</h2>
      <div class="code">
        <pre>type Optional&lt;T&gt; = {{ '{' }} [K in keyof T]?: T[K] {{ '}' }};   // ≈ Partial&lt;T&gt;
type Mutable&lt;T&gt;  = {{ '{' }} -readonly [K in keyof T]: T[K] {{ '}' }}; // strip readonly
type Getters&lt;T&gt;  = {{ '{' }} [K in keyof T as \`get\${{ '{' }}Capitalize&lt;string & K&gt;{{ '}' }}\`]: () =&gt; T[K] {{ '}' }};</pre>
      </div>
      <p>
        Modifiers: <code>?</code> / <code>-?</code> toggle optionality,
        <code>readonly</code> / <code>-readonly</code> toggle immutability, and
        <code>as</code> <strong>re-keys</strong> (key remapping). Remapping a key to
        <code>never</code> <em>drops</em> it — that's how you filter properties by type:
      </p>
      <div class="code">
        <pre>// keep only the keys whose value is a function:
type Methods&lt;T&gt; = {{ '{' }}
  [K in keyof T as T[K] extends Function ? K : never]: T[K]
{{ '}' }};</pre>
      </div>

      <h2>Conditional types — types with if/else</h2>
      <div class="code">
        <pre>type IsString&lt;T&gt; = T extends string ? 'yes' : 'no';
type A = IsString&lt;'hi'&gt;;   // 'yes'
type B = IsString&lt;42&gt;;     // 'no'</pre>
      </div>

      <h2>infer — extract a type</h2>
      <div class="code">
        <pre>type ElementType&lt;T&gt; = T extends (infer U)[] ? U : T;
type C = ElementType&lt;number[]&gt;;   // number

type Unwrap&lt;T&gt; = T extends Promise&lt;infer V&gt; ? V : T;
type D = Unwrap&lt;Promise&lt;User&gt;&gt;;    // User  (this is how Awaited works)</pre>
      </div>

      <h2>Distributive conditionals</h2>
      <p>Conditionals distribute over unions, which is how <code>Exclude</code> works:</p>
      <div class="code">
        <pre>type MyExclude&lt;T, U&gt; = T extends U ? never : T;
type E = MyExclude&lt;'a' | 'b' | 'c', 'b'&gt;;   // 'a' | 'c'</pre>
      </div>

      <h2>Template literal types</h2>
      <div class="code">
        <pre>type Event = \`on\${{ '{' }}Capitalize&lt;'click' | 'hover'&gt;{{ '}' }}\`;   // 'onClick' | 'onHover'
type Px = \`\${{ '{' }}number{{ '}' }}px\`;   // any "&lt;n&gt;px" string</pre>
      </div>

      <div class="warn">
        These are powerful but easy to overuse. In app code you will mostly consume
        the built-in utilities; reach for hand-written mapped/conditional types when
        building <strong>reusable libraries or framework-level helpers</strong>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Mapped types iterate keys: <code>{{ '{' }} [K in keyof T]: ... {{ '}' }}</code>, with <code>?</code>/<code>readonly</code> modifiers and <code>as</code> re-keying.</li>
        <li>Conditional types are type-level if/else: <code>T extends U ? X : Y</code>.</li>
        <li><code>infer</code> captures a type inside a conditional.</li>
        <li>Conditionals distribute over unions; template literals build string types.</li>
      </ul>

      <p><a routerLink="/ts-decorators">Next: Decorators →</a></p>
    </article>
  `,
})
export class MappedConditional {}
