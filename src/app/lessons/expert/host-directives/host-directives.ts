import { Component, Directive, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: the Directive Composition API (hostDirectives) — composing behavior
 * onto a component's host element without inheritance or wrapper DOM. Live
 * demos prove input re-export, host-binding precedence, and that the host
 * component can inject its own host directives.
 */

/**
 * A reusable behavior: lift the host on hover. No template — pure host
 * bindings. Written signal-era: the `host` object replaces @HostBinding /
 * @HostListener decorators one-for-one.
 */
@Directive({
  selector: '[appElevate]',
  host: {
    '[style.display]': '"block"',
    '[style.transition]': '"transform .15s ease, box-shadow .15s ease"',
    '[style.transform]': 'lifted() ? "translateY(-4px)" : "none"',
    '[style.boxShadow]': 'lifted() ? "0 10px 30px rgba(0,0,0,.4)" : "none"',
    '(mouseenter)': 'enter()',
    '(mouseleave)': 'lifted.set(false)',
  },
})
export class Elevate {
  readonly lifted = signal(false);
  readonly lifts = signal(0);
  readonly liftedChange = output<boolean>();

  protected enter() {
    this.lifted.set(true);
    this.lifts.update((n) => n + 1);
    this.liftedChange.emit(true);
  }
}

/** A second behavior with an INPUT — the re-export demo. */
@Directive({
  selector: '[appAccent]',
  host: { '[style.borderLeft]': '"4px solid " + accent()' },
})
export class Accent {
  readonly accent = input('gray');
}

/** Two deliberately conflicting behaviors for the precedence demo. */
@Directive({
  selector: '[appToneRed]',
  host: { '[style.background]': '"rgba(239,68,68,.18)"' },
})
export class ToneRed {}

@Directive({
  selector: '[appToneBlue]',
  host: { '[style.background]': '"rgba(79,70,229,.18)"' },
})
export class ToneBlue {}

/**
 * The component composes Elevate in — and, because a host directive is a
 * regular provider on the host element, the component can inject its own
 * Elevate instance and render its state.
 */
@Component({
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],
  template: `
    <div class="card">
      <ng-content />
      <small style="display:block;margin-top:6px;color:var(--text-muted)">
        lifted: {{ elevate.lifted() }} · lifts so far: {{ elevate.lifts() }}
      </small>
    </div>
  `,
  styles: [`
    .card { padding: 16px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-elevated); }
  `],
})
export class FancyCard {
  /** The host directive's instance — injectable like any element provider. */
  protected readonly elevate = inject(Elevate);
}

/**
 * Re-export demo: Accent's `accent` input is private by default; listing it
 * under the alias `tone` makes it part of THIS component's public API.
 */
@Component({
  selector: 'app-status-card',
  hostDirectives: [{ directive: Accent, inputs: ['accent: tone'] }],
  template: `<div class="card"><ng-content /></div>`,
  styles: [`
    :host { display: block; }
    .card { padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; }
  `],
})
export class StatusCard {}

/** Precedence demo A: two conflicting host directives, no own binding — later wins. */
@Component({
  selector: 'app-tone-card-bare',
  hostDirectives: [ToneRed, ToneBlue],
  template: `<div class="card"><ng-content /></div>`,
  styles: [`
    :host { display: block; border-radius: 10px; }
    .card { padding: 12px 16px; border: 1px dashed var(--border); border-radius: 10px; }
  `],
})
export class ToneCardBare {}

/** Precedence demo B: same two directives, but the component binds the property itself. */
@Component({
  selector: 'app-tone-card-own',
  hostDirectives: [ToneRed, ToneBlue],
  host: { '[style.background]': '"rgba(16,185,129,.18)"' },
  template: `<div class="card"><ng-content /></div>`,
  styles: [`
    :host { display: block; border-radius: 10px; }
    .card { padding: 12px 16px; border: 1px dashed var(--border); border-radius: 10px; }
  `],
})
export class ToneCardOwn {}

@Component({
  selector: 'app-lesson-host-directives',
  imports: [RouterLink, FancyCard, StatusCard, ToneCardBare, ToneCardOwn, Elevate],
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>Directive Composition API</h1>
      <p class="lead">
        <code>hostDirectives</code> lets a component (or directive) apply other
        directives to its own host element — composing reusable behavior without
        inheritance, wrapper elements, or asking consumers to remember extra
        attributes. It is Angular's answer to "favor composition over inheritance,"
        and it happens entirely at <strong>compile time</strong>: zero extra DOM,
        no runtime registration.
      </p>

      <h2>The problem it solves</h2>
      <table class="cmp">
        <tr><th>Approach</th><th>How it reuses behavior</th><th>What goes wrong</th></tr>
        <tr>
          <td><strong>Inheritance</strong> (<code>class Card extends Hoverable</code>)</td>
          <td>base class carries bindings/hooks</td>
          <td>single base class only; metadata isn't inherited cleanly; base-class
            constructor DI leaks into every subclass; behaviors can't be mixed per-component</td>
        </tr>
        <tr>
          <td><strong>Wrapper component</strong></td>
          <td><code>&lt;app-hoverable&gt;&lt;app-card/&gt;&lt;/app-hoverable&gt;</code></td>
          <td>extra DOM breaks CSS (flex/grid parent-child), bloats the tree, and the
            wrapper can't reach the real host element's events cleanly</td>
        </tr>
        <tr>
          <td><strong>Consumer-applied directive</strong></td>
          <td><code>&lt;app-card appElevate&gt;</code></td>
          <td>every consumer must remember it — forget once and the card silently
            loses behavior; the card can't guarantee its own invariants</td>
        </tr>
        <tr>
          <td><strong>hostDirectives</strong></td>
          <td>the component declares its behaviors itself</td>
          <td>— (limitations: directives must be standalone and can't be dynamic)</td>
        </tr>
      </table>

      <h2>Compose behavior in</h2>
      <div class="code"><pre>{{ composeSample }}</pre></div>

      <h2>Live — hover the cards</h2>
      <div class="demo">
        <p class="demo__title">Live — Elevate is composed into the card host (and the card injects it)</p>
        <div style="display:grid;gap:12px;max-width:460px">
          <app-fancy-card>Hover me — I lift, and I never imported any hover logic.</app-fancy-card>
          <app-fancy-card>Same behavior, composed once and reused.</app-fancy-card>
        </div>
        <p style="margin-top:14px" appElevate>
          The bare <code>appElevate</code> directive also works directly on any element
          — hover this paragraph.
        </p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Each card prints <code>lifted</code>/<code>lifts</code> straight from its
          <em>own Elevate instance</em> via <code>inject(Elevate)</code> — a host
          directive is a normal element-injector provider, so the host component can
          read (and drive) its state.
        </p>
      </div>

      <h2>Exposing inputs &amp; outputs — private by default</h2>
      <p>
        A host directive's inputs and outputs are <em>not</em> part of the host
        component's API unless you re-export them explicitly (optionally under an
        alias). This is deliberate: composition shouldn't leak implementation details.
      </p>
      <div class="code"><pre>{{ reexportSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — Accent's input re-exported as <code>tone</code></p>
        <div style="display:grid;gap:10px;max-width:460px">
          <app-status-card [tone]="tone()">
            This card's <code>tone</code> input is really <code>Accent.accent</code>, aliased.
          </app-status-card>
        </div>
        <div class="row" style="margin-top:12px">
          <button (click)="tone.set('var(--green)')">tone = green</button>
          <button (click)="tone.set('var(--amber)')">tone = amber</button>
          <button class="ghost" (click)="tone.set('var(--violet)')">tone = violet</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Binding <code>[accent]</code> on <code>&lt;app-status-card&gt;</code> would be a
          compile error — the un-exported name simply doesn't exist on the host.
        </p>
      </div>

      <h2>Precedence — who wins a host-binding conflict?</h2>
      <p>
        Both <code>ToneRed</code> and <code>ToneBlue</code> bind
        <code>style.background</code> on their host. Compose them and the rules are:
        <strong>later host directives override earlier ones, and the component's own
        host bindings override them all.</strong>
      </p>
      <div class="demo">
        <p class="demo__title">Live — same two conflicting directives, with and without an own binding</p>
        <div style="display:grid;gap:10px;max-width:460px">
          <app-tone-card-bare>
            <code>hostDirectives: [ToneRed, ToneBlue]</code> → blue (listed later) wins
          </app-tone-card-bare>
          <app-tone-card-own>
            same + the component's own <code>host</code> background → green (host) wins
          </app-tone-card-own>
        </div>
      </div>
      <div class="code"><pre>{{ precedenceSample }}</pre></div>

      <h2>Under the hood</h2>
      <ul>
        <li>
          <strong>Compile-time feature:</strong> the compiler bakes the host directives
          into the component's definition. You cannot add them conditionally or at
          runtime — the array must be statically analyzable.
        </li>
        <li>
          <strong>Instantiation order:</strong> host directives are instantiated
          <em>before</em> the host component, in array order. Their lifecycle hooks all
          run (<code>ngOnInit</code>, <code>ngOnDestroy</code>, …), interleaved by that
          same ordering.
        </li>
        <li>
          <strong>DI:</strong> each host directive is registered on the element
          injector — the host component can <code>inject(TheDirective)</code>, and the
          directive can inject anything visible at that element (including the host
          component via <code>forwardRef</code> if needed).
        </li>
        <li>
          <strong>No extra DOM:</strong> unlike a wrapper component, the composed
          behavior attaches to the existing host element — CSS layout, a11y tree and
          querying are untouched.
        </li>
        <li>
          <strong>Transitivity:</strong> a directive can itself declare
          <code>hostDirectives</code> — behaviors compose recursively (the CDK does
          this, e.g. menu items composing focus + dispatch behaviors).
        </li>
      </ul>

      <h2>Where you've already used it</h2>
      <div class="code"><pre>{{ realWorldSample }}</pre></div>
      <p>
        The Angular CDK and Material lean on this API heavily: <code>CdkMenuItem</code>
        composes focus and typeahead behaviors, Material buttons compose ripple and
        interactivity directives. The pattern to copy: keep each behavior a small,
        independently testable directive, then assemble components from them.
      </p>

      <h2>Wrong way vs right way</h2>
      <div class="code"><pre>{{ wrongRightSample }}</pre></div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why must host directives be standalone?</summary>
        <div>The compiler inlines them into the host's definition at compile time —
        there is no NgModule context to resolve them through. A non-standalone
        directive in <code>hostDirectives</code> is a compile error.</div>
      </details>
      <details class="qa">
        <summary>You composed a Tooltip host directive but <code>[tooltipText]</code> doesn't bind. Why?</summary>
        <div>Inputs/outputs of host directives are private by default. Re-export it:
        <code>hostDirectives: [&#123; directive: Tooltip, inputs: ['tooltipText'] &#125;]</code>
        (optionally with an <code>'tooltipText: hint'</code> alias).</div>
      </details>
      <details class="qa">
        <summary>Two host directives and the component all bind <code>class.active</code>. Which value renders?</summary>
        <div>The component's own binding wins; among the host directives, the one
        listed later in the array overrides the earlier one. (Proven live above with
        <code>style.background</code>.)</div>
      </details>
      <details class="qa">
        <summary>Can a host directive and the host component see each other via DI?</summary>
        <div>Yes — both live on the same element injector. The component can
        <code>inject(TheDirective)</code> to read/drive its state; the directive can
        inject the component (use <code>forwardRef</code> for the circular reference)
        or, more loosely, a shared token both provide/consume.</div>
      </details>
      <details class="qa">
        <summary>When is inheritance still the better call?</summary>
        <div>When you're sharing <em>class logic</em> (methods, injected services)
        rather than <em>host behavior</em> (bindings/listeners). hostDirectives can't
        share template or component internals — an abstract base class with no
        metadata is still fine for that.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>hostDirectives</code> applies standalone directives to a component's host — composition without inheritance or wrapper DOM.</li>
        <li>It's compile-time and static: no conditional composition; directives instantiate before the host, in array order.</li>
        <li>Inputs/outputs stay private unless re-exported (with optional aliases) — deliberate encapsulation.</li>
        <li>Binding conflicts: later directive beats earlier, host component beats all.</li>
        <li>Host directive instances are element-injector providers — the host can inject and drive them.</li>
      </ul>

      <p><a routerLink="/control-value-accessor">Next: Custom Form Controls (CVA) →</a></p>
    </article>
  `,
})
export class HostDirectives {
  protected readonly tone = signal('var(--green)');

  readonly composeSample = `@Directive({ selector: '[appElevate]' })
export class Elevate {
  readonly lifted = signal(false);
  // host bindings + listeners — the signal-era spelling of @HostBinding/@HostListener
  // host: { '[style.transform]': 'lifted() ? "translateY(-4px)" : "none"',
  //         '(mouseenter)': 'lifted.set(true)', … }
}

@Component({
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],   // ← the card now HAS Elevate's behavior
  template: '…',
})
export class FancyCard {
  // and can talk to it — it's a provider on this element:
  protected readonly elevate = inject(Elevate);
}`;

  readonly reexportSample = `hostDirectives: [{
  directive: Accent,
  inputs:  ['accent: tone'],   // re-export the input under an alias
  outputs: ['accentChange'],   // re-export an output (aliasing works here too)
}]

// consumer: <app-status-card [tone]="'var(--green)'" />
// [accent] would NOT compile — un-exported names don't exist on the host`;

  readonly precedenceSample = `@Component({
  hostDirectives: [ToneRed, ToneBlue],          // both bind style.background
  host: { '[style.background]': '"…green…"' },  // so does the component
})
// render order of the same property:
//   ToneRed  →  overridden by ToneBlue (later in the array)
//   ToneBlue →  overridden by the component's own host binding
// ⇒ the component wins; drop its binding and blue wins`;

  readonly realWorldSample = `// the CDK composes menu-item behavior from smaller directives:
@Directive({
  selector: '[cdkMenuItemCheckbox]',
  hostDirectives: [CdkMenuItem],        // focus, typeahead, dispatch…
})

// your design system can do the same:
@Component({
  selector: 'ds-button',
  hostDirectives: [
    Ripple,
    { directive: Disableable, inputs: ['disabled'] },
    { directive: Trackable,   inputs: ['analyticsId'] },
  ],
})`;

  readonly wrongRightSample = `// WRONG — inheritance for host behavior: one base only, DI leaks, no mixing
export class FancyCard extends HoverableBase { … }

// WRONG — wrapper element: breaks flex/grid parent-child CSS, extra DOM
<app-hoverable><app-card /></app-hoverable>

// WRONG — hoping every consumer remembers the attribute
<app-card appElevate />   // …until someone forgets

// RIGHT — the component owns its behaviors, statically composed
@Component({ selector: 'app-card', hostDirectives: [Elevate] })`;
}
