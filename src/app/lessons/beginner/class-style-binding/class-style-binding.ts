import { NgClass, NgStyle } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-class-style-binding',
  imports: [RouterLink, NgClass, NgStyle],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Data Binding</span>
      <h1>Class & Style Binding</h1>
      <p class="lead">
        Angular gives you several ways to drive an element's classes and inline
        styles from data — from single-toggle bindings to whole objects.
      </p>

      <h2>Single class & style bindings</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <label><input type="checkbox" [checked]="active()" (change)="active.set($any($event.target).checked)" /> active</label>
          <label>size <input type="range" min="12" max="40" [value]="size()" (input)="size.set(+$any($event.target).value)" /></label>
          <input type="color" [value]="color()" (input)="color.set($any($event.target).value)" />
        </div>
        <div
          class="box"
          [class.box--active]="active()"
          [style.fontSize.px]="size()"
          [style.color]="color()"
        >
          Styled box ({{ size() }}px)
        </div>
      </div>

      <div class="code">
        <pre>&lt;div [class.box--active]="active()"
     [style.fontSize.px]="size()"
     [style.color]="color()"&gt;...&lt;/div&gt;</pre>
      </div>
      <div class="note">
        <code>[class.name]="bool"</code> toggles one class. <code>[style.prop]="val"</code>
        sets one style; you can append a unit, e.g. <code>[style.width.px]</code> or
        <code>[style.width.%]</code>.
      </div>

      <h2>Binding many classes / styles at once</h2>
      <p>Bind an object or array to <code>[class]</code> / <code>[style]</code>:</p>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <button (click)="state.set('ok')">ok</button>
          <button (click)="state.set('warn')">warn</button>
          <button (click)="state.set('error')">error</button>
        </div>
        <div
          class="box"
          [class]="{ 'box--ok': state() === 'ok', 'box--warn': state() === 'warn', 'box--error': state() === 'error' }"
          [style]="{ fontWeight: '600', letterSpacing: '0.04em' }"
        >
          state = {{ state() }}
        </div>
      </div>

      <div class="code">
        <pre>&lt;div [class]="{{ '{' }} active: isActive(), error: hasError() {{ '}' }}"
     [style]="{{ '{' }} color: 'red', fontWeight: '600' {{ '}' }}"&gt;...&lt;/div&gt;</pre>
      </div>

      <div class="note">
        Bound classes <strong>merge</strong> with the static <code>class</code> attribute
        — they don't replace it. Above, <code>class="box"</code> stays applied while
        <code>[class]</code> adds/removes the state classes. The same holds for
        <code>style</code>. When two bindings target the same class/style, the more
        specific one wins (e.g. <code>[class.box--active]</code> beats a key inside
        <code>[class]</code>), and <code>!important</code> is honoured in style strings.
      </div>

      <h2>NgClass & NgStyle directives</h2>
      <p>
        The <code>ngClass</code> and <code>ngStyle</code> directives predate the
        bindings above. They still work and accept strings, arrays or objects, but
        for new code the native <code>[class]</code> / <code>[style]</code> bindings
        are usually clearer and faster.
      </p>
      <div class="demo">
        <p class="demo__title">Live — ngClass / ngStyle</p>
        <div
          class="box"
          [ngClass]="{ 'box--active': active(), 'box--ok': state() === 'ok' }"
          [ngStyle]="{ 'border-style': active() ? 'solid' : 'dashed' }"
        >
          driven by ngClass / ngStyle
        </div>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>[class.x]</code> / <code>[style.x]</code> toggle or set a single thing.</li>
        <li><code>[class]</code> / <code>[style]</code> accept objects/arrays/strings for many at once.</li>
        <li>Style bindings support unit suffixes like <code>.px</code> and <code>.%</code>.</li>
        <li><code>ngClass</code> / <code>ngStyle</code> are the older directive equivalents.</li>
      </ul>

      <p><a routerLink="/control-flow-if">Next: Control Flow — &#64;if →</a></p>
    </article>
  `,
  styles: [
    `
      .box {
        padding: 18px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        transition: all 0.15s ease;
      }
      .box--active {
        border-color: var(--violet);
        box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.25);
      }
      .box--ok {
        background: rgba(46, 193, 107, 0.15);
        border-color: var(--green);
      }
      .box--warn {
        background: rgba(245, 166, 35, 0.15);
        border-color: var(--amber);
      }
      .box--error {
        background: rgba(221, 0, 49, 0.15);
        border-color: var(--accent);
      }
    `,
  ],
})
export class ClassStyleBinding {
  protected readonly active = signal(true);
  protected readonly size = signal(20);
  protected readonly color = signal('#7c4dff');
  protected readonly state = signal<'ok' | 'warn' | 'error'>('ok');
}
