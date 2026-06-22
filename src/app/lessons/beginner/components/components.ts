import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A small child component demonstrating that components are composable,
 * reusable building blocks. Declared in the same file to keep the lesson
 * self-contained. It receives its name through an input (covered in depth in
 * the "Component Inputs" lesson).
 */
@Component({
  selector: 'app-greeting-card',
  template: `
    <div class="gc">
      <span class="gc__avatar">{{ initial() }}</span>
      <p class="gc__msg">Hello, <strong>{{ name() }}</strong> 👋</p>
    </div>
  `,
  styles: [
    `
      .gc {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px 14px;
      }
      .gc__avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--accent);
        color: #fff;
        font-weight: 700;
      }
      .gc__msg {
        margin: 0;
      }
    `,
  ],
})
export class GreetingCard {
  readonly name = input('Ada');
  readonly initial = computed(() => this.name().charAt(0).toUpperCase() || '?');
}

@Component({
  selector: 'app-lesson-components',
  imports: [RouterLink, GreetingCard],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Components & Templates</span>
      <h1>Components</h1>
      <p class="lead">
        Components are the fundamental building block of every Angular app. A
        component couples a <em>template</em> (what the user sees), a
        <em>class</em> (the data and behavior) and <em>styles</em>, all wired
        together by the <code>&#64;Component</code> decorator.
      </p>

      <h2>Anatomy of a component</h2>
      <div class="code">
        <pre>import {{ '{' }} Component, input {{ '}' }} from '&#64;angular/core';

&#64;Component({{ '{' }}
  selector: 'app-greeting-card',   // how you use it in a template
  imports: [],                     // components/directives/pipes it uses
  template: '&lt;p&gt;Hello, {{ '{{' }} name() {{ '}}' }}&lt;/p&gt;',
  styles: ['p {{ '{' }} color: hotpink {{ '}' }}'],
{{ '}' }})
export class GreetingCard {{ '{' }}
  readonly name = input('Ada');
{{ '}' }}</pre>
      </div>

      <p>
        Modern Angular components are <strong>standalone</strong> by default — no
        <code>NgModule</code> required. They declare their own dependencies in the
        <code>imports</code> array. The component below is rendered live; change
        the text and watch every instance update:
      </p>

      <div class="demo">
        <p class="demo__title">Live, reusable component</p>
        <div class="row" style="margin-bottom: 14px">
          <label for="name">Name</label>
          <input id="name" [value]="displayName()" (input)="rename($event)" />
        </div>
        <div class="row">
          <app-greeting-card [name]="displayName()" />
          <app-greeting-card name="Grace" />
          <app-greeting-card name="Linus" />
        </div>
        <p style="margin: 12px 0 0; color: var(--text-muted); font-size: .85rem">
          The same component, reused three times — that is composition.
        </p>
      </div>

      <div class="note">
        <strong>selector</strong> is a CSS selector. <code>app-greeting-card</code>
        means you embed the component as <code>&lt;app-greeting-card /&gt;</code>.
        The <code>app-</code> prefix is configured in <code>angular.json</code>.
      </div>

      <h2>templateUrl & styleUrl</h2>
      <p>
        For larger components you split the HTML and CSS into their own files
        using <code>templateUrl</code> and <code>styleUrl</code> instead of inline
        strings. This lesson uses an inline template so the whole concept lives in
        one file — both styles are equally valid.
      </p>

      <h2>Selector forms</h2>
      <p>The selector is a CSS selector, so a component can match more than an element tag:</p>
      <div class="code">
        <pre>selector: 'app-card'      // element:   &lt;app-card&gt;
selector: '[appCard]'     // attribute: &lt;div appCard&gt;
selector: '.app-card'     // class:     &lt;div class="app-card"&gt;
selector: 'app-card, [appCard]'   // multiple — match either form</pre>
      </div>

      <h2>Style encapsulation</h2>
      <p>
        A component's <code>styles</code> are <strong>scoped to that component</strong>
        by default (<code>ViewEncapsulation.Emulated</code>) — Angular adds a unique
        attribute to its elements so <code>p {{ '{' }} color: hotpink {{ '}' }}</code> can't
        leak out and affect other components. Options:
      </p>
      <ul>
        <li><code>Emulated</code> (default) — scoped via attribute rewriting, no Shadow DOM.</li>
        <li><code>ShadowDom</code> — real browser Shadow DOM isolation.</li>
        <li><code>None</code> — styles become global. Use deliberately, rarely.</li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li>A component = decorator metadata + a template + a class + styles.</li>
        <li>Standalone components import their own dependencies; no NgModule.</li>
        <li>The <code>selector</code> is a CSS selector — element, attribute or class.</li>
        <li>Styles are component-scoped by default (Emulated encapsulation).</li>
        <li>Components compose — they nest inside one another to build a UI tree.</li>
      </ul>

      <p><a routerLink="/interpolation">Next: Interpolation &amp; Expressions →</a></p>
    </article>
  `,
})
export class Components {
  protected readonly displayName = signal('Ada');

  protected rename(event: Event) {
    this.displayName.set((event.target as HTMLInputElement).value);
  }
}
