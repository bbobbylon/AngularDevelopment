import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Elevate } from './elevate/elevate';
import { FancyCard } from './fancy-card/fancy-card';
import { StatusCard } from './status-card/status-card';
import { ToneCardBare } from './tone-card-bare/tone-card-bare';
import { ToneCardOwn } from './tone-card-own/tone-card-own';

/**
 * Lesson: the Directive Composition API (hostDirectives) — composing behavior
 * onto a component's host element without inheritance or wrapper DOM. Live
 * demos prove input re-export, host-binding precedence, and that the host
 * component can inject its own host directives.
 */
@Component({
  selector: 'app-lesson-host-directives',
  imports: [RouterLink, FancyCard, StatusCard, ToneCardBare, ToneCardOwn, Elevate],
  styleUrl: './host-directives.css',
  templateUrl: './host-directives.html',
})
export class HostDirectives {
  /**
   * The tone the composition demo is applying.
   */
  protected readonly tone = signal('var(--green)');

  /**
   * Sample: `hostDirectives`, applying a behaviour without inheritance or a
   * wrapper element.
   */
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

  /**
   * Sample: re-exporting a composed directive's inputs and outputs, with aliases.
   * Without this they are invisible to the host's consumers.
   */
  readonly reexportSample = `hostDirectives: [{
  directive: Accent,
  inputs:  ['accent: tone'],   // re-export the input under an alias
  outputs: ['accentChange'],   // re-export an output (aliasing works here too)
}]

// consumer: <app-status-card [tone]="'var(--green)'" />
// [accent] would NOT compile — un-exported names don't exist on the host`;

  /**
   * Sample: precedence when several sources bind the same host property — host
   * directives apply in order, and the component's own `host` bindings win.
   */
  readonly precedenceSample = `@Component({
  hostDirectives: [ToneRed, ToneBlue],          // both bind style.background
  host: { '[style.background]': '"…green…"' },  // so does the component
})
// render order of the same property:
//   ToneRed  →  overridden by ToneBlue (later in the array)
//   ToneBlue →  overridden by the component's own host binding
// ⇒ the component wins; drop its binding and blue wins`;

  /**
   * Sample: the CDK composing menu-item behaviour from smaller directives, as
   * evidence the pattern is how the framework's own libraries are built.
   */
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

  /**
   * Sample: inheritance against composition. Inheritance gives one base class,
   * leaks DI, and cannot mix; `hostDirectives` composes as many behaviours as
   * needed.
   */
  readonly wrongRightSample = `// WRONG — inheritance for host behavior: one base only, DI leaks, no mixing
export class FancyCard extends HoverableBase { … }

// WRONG — wrapper element: breaks flex/grid parent-child CSS, extra DOM
<app-hoverable><app-card /></app-hoverable>

// WRONG — hoping every consumer remembers the attribute
<app-card appElevate />   // …until someone forgets

// RIGHT — the component owns its behaviors, statically composed
@Component({ selector: 'app-card', hostDirectives: [Elevate] })`;
}
