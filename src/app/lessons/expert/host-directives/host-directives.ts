import { Component, Directive, HostBinding, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A reusable behavior: lift the host on hover. No template — pure host bindings. */
@Directive({ selector: '[appElevate]' })
export class Elevate {
  @HostBinding('style.transition') readonly t = 'transform .15s ease, box-shadow .15s ease';
  @HostBinding('style.display') readonly d = 'block';
  @HostBinding('style.transform') transform = 'none';
  @HostBinding('style.boxShadow') shadow = 'none';

  @HostListener('mouseenter') up() {
    this.transform = 'translateY(-4px)';
    this.shadow = '0 10px 30px rgba(0,0,0,.4)';
  }
  @HostListener('mouseleave') down() {
    this.transform = 'none';
    this.shadow = 'none';
  }
}

/** The component composes Elevate's behavior in — without inheritance or wrapping. */
@Component({
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],
  template: `<div style="padding:16px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated)">
    <ng-content />
  </div>`,
})
export class FancyCard {}

@Component({
  selector: 'app-lesson-host-directives',
  imports: [RouterLink, FancyCard, Elevate],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>Directive Composition API</h1>
      <p class="lead">
        <code>hostDirectives</code> lets a component (or directive) apply other
        directives to its own host element — composing reusable behavior without
        inheritance, wrapper elements, or asking consumers to remember extra
        attributes. It is Angular's answer to "favor composition over inheritance."
      </p>

      <h2>Compose behavior in</h2>
      <div class="code">
        <pre>&#64;Directive({{ '{' }} selector: '[appElevate]' {{ '}' }})
export class Elevate {{ '{' }}
  &#64;HostListener('mouseenter') up() {{ '{' }} /* lift the host */ {{ '}' }}
{{ '}' }}

&#64;Component({{ '{' }}
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],     // ← the card now has Elevate's behavior
{{ '}' }})
export class FancyCard {{ '{' }}{{ '}' }}</pre>
      </div>

      <h2>Try it — hover the cards</h2>
      <div class="demo">
        <p class="demo__title">Live — Elevate is composed into the card host</p>
        <div style="display:grid;gap:12px;max-width:420px">
          <app-fancy-card>Hover me — I lift, and I never imported any hover logic.</app-fancy-card>
          <app-fancy-card>Same behavior, composed once and reused.</app-fancy-card>
        </div>
        <p style="margin-top:14px" appElevate>
          The bare <code>appElevate</code> directive also works directly on any element
          — hover this paragraph.
        </p>
      </div>

      <h2>Exposing inputs &amp; outputs</h2>
      <div class="code">
        <pre>hostDirectives: [{{ '{' }}
  directive: Tooltip,
  inputs: ['tooltipText: hint'],     // re-export the directive's input under an alias
  outputs: ['shown'],                // re-export its output
{{ '}' }}]</pre>
      </div>
      <p>
        By default a host directive's inputs/outputs are <em>private</em>. List them
        explicitly to make them part of the host component's public API.
      </p>

      <div class="tip">
        Host directives must be <strong>standalone</strong>. Use them for cross-cutting
        UI behavior — focus rings, tooltips, drag handles, analytics — that you want to
        sprinkle onto many components without duplicating code.
      </div>
      <div class="note">
        A host directive's own lifecycle hooks run, and its host bindings merge with the
        host component's (a conflict on the same property is resolved by order). Its
        inputs/outputs are private unless re-exported, and you can't bind them
        dynamically from the consumer's template unless you do re-export them. Reach for
        <code>hostDirectives</code> over inheritance — composition keeps each behavior
        independently testable.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>hostDirectives</code> applies standalone directives to a component's host.</li>
        <li>It composes behavior without inheritance or extra wrapper DOM.</li>
        <li>Inputs/outputs are private unless you re-export them (with optional aliases).</li>
        <li>Ideal for reusable, cross-cutting interaction behavior.</li>
      </ul>

      <p><a routerLink="/control-value-accessor">Next: Custom Form Controls (CVA) →</a></p>
    </article>
  `,
})
export class HostDirectives {}
