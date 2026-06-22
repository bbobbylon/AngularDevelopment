import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const THEME = {
  primary: '#dd0031',
  accent: '#7c4dff',
  success: '#2ec16b',
} as const;

type ThemeKey = keyof typeof THEME; // 'primary' | 'accent' | 'success'

@Component({
  selector: 'app-lesson-ts-keyof-typeof',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Advanced Types</span>
      <h1>keyof, typeof & Indexed Access</h1>
      <p class="lead">
        These operators let you derive types <em>from</em> values and other types — the
        key to writing helpers that stay in sync with your data automatically. When the
        value changes, the derived type changes with it; nothing drifts out of date.
      </p>

      <h2>typeof — type from a value</h2>
      <div class="code">
        <pre>const theme = {{ '{' }} primary: '#dd0031', accent: '#7c4dff' {{ '}' }} as const;
type Theme = typeof theme;   // {{ '{' }} readonly primary: '#dd0031'; readonly accent: '#7c4dff' {{ '}' }}

function makeUser(name: string) {{ '{' }} return {{ '{' }} id: 1, name {{ '}' }}; {{ '}' }}
type MakeUser = typeof makeUser;   // (name: string) =&gt; {{ '{' }} id: number; name: string {{ '}' }}</pre>
      </div>
      <p>
        The <strong>type-level</strong> <code>typeof</code> (used in a type position)
        lifts a runtime value or function into a type. <code>as const</code> freezes the
        literals so values become exact strings, not the wider <code>string</code>. Note
        it only works on identifiers and property accesses — not arbitrary expressions.
      </p>

      <h2>keyof — union of a type's keys</h2>
      <div class="code">
        <pre>type ThemeKey = keyof typeof theme;     // 'primary' | 'accent'
type AnyKey   = keyof Record&lt;string, number&gt;;  // string | number
type ArrKeys  = keyof string[];          // number | 'length' | 'push' | … (all array members)</pre>
      </div>

      <h2>Indexed access — look up a member type</h2>
      <div class="code">
        <pre>interface User {{ '{' }} id: number; roles: string[]; address: {{ '{' }} city: string {{ '}' }} {{ '}' }}
type Id   = User['id'];               // number
type City = User['address']['city'];  // string  (nested lookup)
type Vals = User[keyof User];         // number | string[] | {{ '{' }} city: string {{ '}' }}

// number index = element type of an array or tuple:
type Role  = User['roles'][number];   // string
type Tuple = [boolean, string];
type Second = Tuple[1];               // string</pre>
      </div>

      <h2>The classic type-safe getter</h2>
      <div class="code">
        <pre>function prop&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {{ '{' }}
  return obj[key];
{{ '}' }}
prop(user, 'id');       // return type narrowed to number
// prop(user, 'xyz');   // ❌ 'xyz' is not a key of user — typos caught at build</pre>
      </div>

      <div class="demo">
        <p class="demo__title">Live — keys derived from the THEME object</p>
        <div class="row" style="margin-bottom:10px">
          @for (k of keys; track k) {
            <button [class.ghost]="key() !== k" (click)="key.set(k)">{{ k }}</button>
          }
        </div>
        <p class="row">
          <span class="swatch" [style.background]="value()"></span>
          <code>THEME['{{ key() }}'] = {{ value() }}</code>
        </p>
      </div>

      <div class="tip">
        This trio is the foundation of mapped types and most library generics. A form
        helper typed <code>&lt;K extends keyof T&gt;(key: K) =&gt; T[K]</code> guarantees you
        can only read fields that actually exist — and returns the right type for each.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>typeof value</code> (in a type position) lifts a runtime value or function into a type.</li>
        <li><code>keyof T</code> yields the union of <code>T</code>'s property names.</li>
        <li><code>T[K]</code> looks up a member type; <code>T[number]</code> gives an array/tuple element type.</li>
        <li><code>K extends keyof T</code> + <code>T[K]</code> = fully type-safe, self-updating property access.</li>
      </ul>

      <p><a routerLink="/ts-mapped-conditional">Next: Mapped &amp; Conditional Types →</a></p>
    </article>
  `,
})
export class KeyofTypeof {
  protected readonly keys = Object.keys(THEME) as ThemeKey[];
  protected readonly key = signal<ThemeKey>('primary');
  protected value(): string {
    return THEME[this.key()];
  }
}
