import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Direction = 'north' | 'east' | 'south' | 'west';

@Component({
  selector: 'app-lesson-ts-enums',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Type System</span>
      <h1>Enums & Literal Unions</h1>
      <p class="lead">
        Enums name a set of related constants. TypeScript offers numeric and string
        enums — but unlike most TS features, a regular <code>enum</code> emits real
        runtime code (an object). In modern code a <strong>union of string
        literals</strong> or an <code>as const</code> object is often the leaner choice.
      </p>

      <h2>Numeric enums</h2>
      <div class="code">
        <pre>enum Status {{ '{' }} Idle, Loading, Done {{ '}' }}   // 0, 1, 2 by default
enum Http {{ '{' }} OK = 200, NotFound = 404 {{ '}' }} // explicit values
let s: Status = Status.Loading;       // 1
Status[1];                            // 'Loading' — numeric enums get a reverse map

// bit flags — combine with bitwise OR:
enum Perm {{ '{' }} Read = 1 &lt;&lt; 0, Write = 1 &lt;&lt; 1, Admin = Read | Write {{ '}' }}</pre>
      </div>

      <h2>String enums</h2>
      <div class="code">
        <pre>enum Role {{ '{' }}
  Admin  = 'ADMIN',
  Member = 'MEMBER',
{{ '}' }}
let r = Role.Admin;   // 'ADMIN' — readable in logs &amp; network payloads</pre>
      </div>
      <p>String enums have <strong>no</strong> reverse mapping, and every member needs an explicit value.</p>

      <h2>const enums</h2>
      <p>
        <code>const enum</code> is inlined at compile time — no object is emitted, so it
        is cheaper. The trade-off: it can't be used where a runtime value is needed
        (e.g. iterating its members), and some bundlers/<code>isolatedModules</code>
        setups disallow it across files.
      </p>
      <div class="code">
        <pre>const enum Size {{ '{' }} S, M, L {{ '}' }}
const x = Size.M;   // compiles to: const x = 1;  (the enum object disappears)</pre>
      </div>

      <h2>…or just a union of literals</h2>
      <p>
        Often you don't need a runtime enum at all. A literal union is fully type-safe,
        tree-shakable, serializes naturally, and needs no import to use its values:
      </p>
      <div class="code">
        <pre>type Direction = 'north' | 'east' | 'south' | 'west';
const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

// Want the union AND a runtime list/object? Derive both from one as-const object:
const LogLevel = {{ '{' }} Debug: 'debug', Info: 'info', Error: 'error' {{ '}' }} as const;
type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];  // 'debug' | 'info' | 'error'
Object.values(LogLevel);   // ['debug', 'info', 'error'] — iterable at runtime</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Live — a literal union</p>
        <div class="row" style="margin-bottom:10px">
          @for (d of directions; track d) {
            <button [class.ghost]="dir() !== d" (click)="dir.set(d)">{{ d }}</button>
          }
        </div>
        <p>heading: <strong>{{ dir() }}</strong> ({{ degrees() }}°)</p>
      </div>

      <table class="t">
        <tr><th>Want…</th><th>Use</th></tr>
        <tr><td>A simple set of options (component state, mode)</td><td>String-literal union</td></tr>
        <tr><td>Union + a runtime list/lookup</td><td><code>as const</code> object + derived type</td></tr>
        <tr><td>Named namespace or numeric/bit flags</td><td><code>enum</code></td></tr>
        <tr><td>Zero runtime footprint, single file</td><td><code>const enum</code></td></tr>
      </table>

      <div class="tip">
        Default to <strong>string-literal unions</strong>. They cost nothing at runtime,
        diff cleanly, and narrow beautifully (see <a routerLink="/ts-narrowing">Narrowing</a>).
        Reach for an enum only when you specifically want a named namespace or flags.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Numeric enums auto-increment and have reverse mapping; string enums are explicit, no reverse map.</li>
        <li>A regular <code>enum</code> emits a runtime object; <code>const enum</code> inlines and emits nothing.</li>
        <li>Literal unions (<code>'a' | 'b'</code>) are usually simpler, tree-shakable, and import-free.</li>
        <li>An <code>as const</code> object gives you both a literal union <em>and</em> an iterable runtime value.</li>
      </ul>

      <p><a routerLink="/ts-narrowing">Next: Type Narrowing &amp; Guards →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin-top: 8px; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }`,
  ],
})
export class Enums {
  protected readonly directions: Direction[] = ['north', 'east', 'south', 'west'];
  protected readonly dir = signal<Direction>('north');

  protected degrees(): number {
    return { north: 0, east: 90, south: 180, west: 270 }[this.dir()];
  }
}
